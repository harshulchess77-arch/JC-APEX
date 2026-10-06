import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Radio, CheckCircle2, LayoutDashboard, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRealtimeTelemetry, COMMAND_STATUS } from '../hooks/useRealtimeTelemetry';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

const FLAG_CFG = {
  green:  { border: 'border-green-500/30',  bg: 'bg-green-500/10',  text: 'text-green-400',  label: '● GREEN'  },
  yellow: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: '● YELLOW' },
  red:    { border: 'border-primary/30',    bg: 'bg-primary/10',    text: 'text-primary',    label: '● RED — STOP', pulse: true },
  black:  { border: 'border-white/10',      bg: 'bg-white/5',       text: 'text-white/40',   label: '● BLACK'  },
};

const COMMANDS = [
  { label: 'BOX THIS LAP', color: '#ef4444', border: '#ef444430' },
  { label: 'SAVE ENERGY',  color: '#22c55e', border: '#22c55e30' },
  { label: 'HOLD PACE',    color: '#eab308', border: '#eab30830' },
  { label: 'PUSH HARD',    color: '#a78bfa', border: '#a78bfa30' },
  { label: 'COOL DOWN',    color: '#60a5fa', border: '#60a5fa30' },
];

function BigArc({ value, max, color }) {
  const pct = Math.min(value / max, 1);
  const r = 128, cx = 150, cy = 155;
  const toRad = d => ((d - 90) * Math.PI) / 180;
  const arc = (s, e) => {
    const x1 = cx + r * Math.cos(toRad(s)), y1 = cy + r * Math.sin(toRad(s));
    const x2 = cx + r * Math.cos(toRad(e)), y2 = cy + r * Math.sin(toRad(e));
    return `M ${x1} ${y1} A ${r} ${r} 0 ${e - s > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const endAngle = -135 + pct * 270;
  const needleRad = toRad(endAngle);

  return (
    <svg width="300" height="260" viewBox="0 0 300 260" className="absolute inset-0">
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
      {/* Track */}
      <path d={arc(-135, 135)} fill="none" stroke="#111" strokeWidth="8" strokeLinecap="round" />
      {/* Progress */}
      {pct > 0 && <path d={arc(-135, endAngle)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }} />}
      {/* Ticks */}
      {Array.from({ length: 19 }, (_, i) => {
        const a = toRad(-135 + i * 15);
        const isMaj = i % 3 === 0;
        return <line key={i}
          x1={cx + (r - 14) * Math.cos(a)} y1={cy + (r - 14) * Math.sin(a)}
          x2={cx + (r - 4)  * Math.cos(a)} y2={cy + (r - 4)  * Math.sin(a)}
          stroke={isMaj ? '#333' : '#1a1a1a'} strokeWidth={isMaj ? 2 : 1} />;
      })}
      {/* Needle */}
      {pct > 0 && <line x1={cx} y1={cy}
        x2={cx + (r - 28) * Math.cos(needleRad)} y2={cy + (r - 28) * Math.sin(needleRad)}
        stroke={color} strokeWidth="2" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />}
      <circle cx={cx} cy={cy} r="6" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  );
}

export default function DriverHUD() {
  const navigate = useNavigate();
  const { logout } = usePasscodeAuth();
  const { telemetry, flag: localFlag, oracleMessages, commsMessages, formatTime, targetPace, signalLost, lastPacketTime } = useTelemetry();
  const { incomingCommands, sendAck, broadcastDriverStatus, driverTelemetry } = useRealtimeTelemetry('driver');
  const [focusMode, setFocusMode] = useState(false);
  // Use flag from realtime broadcast if available, otherwise fall back to local state
  const flag = driverTelemetry?.flag || localFlag;
  const flagCfg = FLAG_CFG[flag] || FLAG_CFG.green;
  const latestOracle = oracleMessages[0];
  const pitMessages = commsMessages.filter(m => m.from === 'pit');

  // Broadcast driver status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      broadcastDriverStatus(telemetry, incomingCommands[0]);
    }, 1000);
    return () => clearInterval(interval);
  }, [telemetry, incomingCommands, broadcastDriverStatus]);

  const battColor = telemetry.battery < 20 ? '#ef4444' : telemetry.battery < 40 ? '#eab308' : '#22c55e';
  const tempColor = telemetry.temp > 58 ? '#ef4444' : telemetry.temp > 46 ? '#eab308' : '#22d3ee';
  const speedColor = telemetry.speed > 32 ? '#ef4444' : '#ffffff';

  // Time since last packet for signal status
  const timeSinceLastPacket = Math.floor((Date.now() - lastPacketTime) / 1000);
  const signalStatus = signalLost ? 'LOST' : timeSinceLastPacket < 2 ? 'EXCELLENT' : timeSinceLastPacket < 5 ? 'GOOD' : 'DEGRADED';
  const signalColor = signalLost ? '#ef4444' : timeSinceLastPacket < 2 ? '#22c55e' : timeSinceLastPacket < 5 ? '#eab308' : '#f97316';

  // Command banner color based on command type
  const getCommandColor = (command) => {
    const payload = command?.payload?.toUpperCase() || '';
    if (payload.includes('BOX')) return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' };
    if (payload.includes('PACE DOWN')) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' };
    if (payload.includes('TARGET')) return { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' };
    if (payload.includes('PUSH')) return { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' };
    return { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' };
  };

  const handleAck = (commandId) => {
    sendAck(commandId);
  };

  return (
    <div className={`h-screen bg-[#080808] flex flex-col overflow-hidden select-none ${focusMode ? 'fullscreen' : ''}`}>
      {/* Command Banner Overlay */}
      <AnimatePresence>
        {incomingCommands.length > 0 && incomingCommands[0].status !== COMMAND_STATUS.EXPIRED && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 left-0 right-0 z-40 p-4 border-b-2 ${getCommandColor(incomingCommands[0]).bg} ${getCommandColor(incomingCommands[0]).border}`}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${getCommandColor(incomingCommands[0]).border.replace('border-', 'bg-')}`} />
                <div>
                  <div className={`text-[10px] font-mono tracking-widest ${getCommandColor(incomingCommands[0]).text} uppercase`}>
                    {incomingCommands[0].sender} COMMAND
                  </div>
                  <div className={`text-xl font-display font-black ${getCommandColor(incomingCommands[0]).text}`}>
                    {incomingCommands[0].payload || incomingCommands[0].type || 'INCOMING COMMAND'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAck(incomingCommands[0].id)}
                className={`flex items-center gap-2 px-6 py-3 rounded border ${getCommandColor(incomingCommands[0]).border} ${getCommandColor(incomingCommands[0]).bg} ${getCommandColor(incomingCommands[0]).text} text-sm font-display font-bold tracking-wider hover:opacity-80 transition-all`}
              >
                <CheckCircle2 className="w-5 h-5" />
                ACKNOWLEDGE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flag Banner Overlay */}
      <AnimatePresence>
        {flag !== 'green' && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className={`fixed top-12 left-0 right-0 z-30 border-b-2 ${
              flag === 'yellow' ? 'bg-yellow-500/90 border-yellow-600' :
              flag === 'red' ? 'bg-red-600/90 border-red-700' :
              flag === 'black' ? 'bg-zinc-900/95 border-zinc-700' :
              'bg-green-600/90 border-green-700'
            }`}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-center py-3">
              <div className={`text-2xl font-display font-black tracking-widest ${
                flag === 'yellow' ? 'text-black' :
                flag === 'red' ? 'text-white' :
                flag === 'black' ? 'text-white' :
                'text-white'
              }`}>
                {flag.toUpperCase()} FLAG
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus mode toggle button */}
      <button
        onClick={() => setFocusMode(!focusMode)}
        className="fixed top-2 right-2 z-50 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 text-[8px] font-mono tracking-widest transition-all"
      >
        {focusMode ? 'EXIT FOCUS' : 'FOCUS MODE'}
      </button>

      {/* Top bar - hidden in focus mode */}
      {!focusMode && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 h-9 border-b border-white/[0.06] bg-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-[7px] font-black text-white">JC</span>
              </div>
              <span className="font-display font-black text-sm tracking-widest text-white">APEX</span>
            </div>
            <button onClick={() => navigate('/pit')}
              className="flex items-center gap-1 text-[8px] font-mono tracking-widest text-white/40 hover:text-white transition-colors uppercase px-1.5 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
              <LayoutDashboard className="w-2.5 h-2.5" /> PIT
            </button>
            <button onClick={() => navigate('/director')}
              className="flex items-center gap-1 text-[8px] font-mono tracking-widest text-white/40 hover:text-white transition-colors uppercase px-1.5 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
              <Flag className="w-2.5 h-2.5" /> DIRECTOR
            </button>
            <AnimatePresence mode="wait">
              <motion.span key={flag} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`text-[8px] font-display font-bold tracking-widest px-2 py-0.5 rounded border ${flagCfg.border} ${flagCfg.bg} ${flagCfg.text} ${flagCfg.pulse ? 'animate-pulse' : ''}`}>
                {flagCfg.label}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4 text-[8px] font-mono">
            <span className="text-white/25">LAP <span className="text-white/60 font-bold">#{Math.floor(telemetry.lap)}</span></span>
            <span className="text-white/20">{formatTime(telemetry.raceTime)}</span>
            <span style={{ color: battColor }} className="font-bold">{telemetry.battery < 40 ? 'CONSERVE' : telemetry.battery > 60 ? 'BALANCED' : 'NOMINAL'}</span>
            <span className="text-white/15">GHOST-LINK™</span>
            {/* Signal Status */}
            <div className="flex items-center gap-1.5" style={{ color: signalColor }}>
              <div className={`w-1.5 h-1.5 rounded-full ${signalLost ? 'animate-pulse' : 'bg-current'}`} />
              <span className="font-bold">{signalStatus}</span>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-white/15 hover:text-white/40 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - hidden in focus mode */}
        {!focusMode && (
          <div className="w-44 flex-shrink-0 border-r border-white/[0.06] bg-[#0b0b0b] flex flex-col overflow-y-auto p-3 gap-3">
          {/* Driver Commands */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Radio className="w-2.5 h-2.5 text-white/15" />
              <span className="text-[7px] font-mono tracking-widest text-white/15 uppercase">Driver Commands</span>
            </div>
            <div className="space-y-1">
              {COMMANDS.map(cmd => (
                <button key={cmd.label}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded border text-[10px] font-display font-bold tracking-wider transition-all hover:opacity-90"
                  style={{ borderColor: cmd.border, background: `${cmd.color}08`, color: cmd.color }}>
                  {cmd.label}
                  <span className="opacity-30">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ghost-Link Feed */}
          <div className="border-t border-white/[0.04] pt-3">
            <div className="text-[7px] font-mono text-white/15 tracking-widest mb-1">((●)) GHOST-LINK™ FEED</div>
            <div className="text-[7px] font-mono text-primary/50 mb-2 tracking-widest">((●)) PRIORITY ALERTS</div>
            {pitMessages.length === 0 ? (
              <p className="text-[8px] font-mono text-white/15 text-center py-3">No active alerts</p>
            ) : pitMessages.slice(-3).map((m, i) => (
              <div key={i} className="text-[8px] font-mono text-white/35 border border-white/[0.04] rounded px-2 py-1 mb-1">{m.text}</div>
            ))}
          </div>

          {/* Predictive Lap Engine */}
          <div className="border-t border-white/[0.04] pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[7px] font-mono text-white/15 tracking-widest">⚡ PREDICTIVE LAP</span>
              <span className="text-[7px] font-mono px-1 rounded border border-yellow-500/25 text-yellow-500">ON PACE</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <div>
                <div className="text-[6px] font-mono text-white/15 mb-1">PROJ LAP</div>
                <div className="text-base font-display font-black text-yellow-400">—</div>
              </div>
              <div>
                <div className="text-[6px] font-mono text-white/15 mb-1">Δ VS PB</div>
                <div className="text-base font-display font-black text-white/30">—</div>
              </div>
            </div>
            <div className="flex justify-around text-[6px] font-mono text-white/20">
              {['S1', 'S2', 'S3'].map(s => (
                <div key={s} className="text-center">
                  <div className="w-4 h-4 rounded-full border border-white/10 flex items-center justify-center mb-0.5 mx-auto text-[7px]">
                    {s[1]}
                  </div>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Lap Timing */}
          <div className="border-t border-white/[0.04] pt-3 space-y-1">
            <div className="text-[7px] font-display font-bold tracking-widest text-white/15 uppercase mb-2">Lap Timing</div>
            {[
              { label: 'LAPS', value: Math.floor(telemetry.lap), color: '#ef4444' },
              { label: 'DIST', value: `${(telemetry.lap * 0.25).toFixed(2)} mi`, color: '#60a5fa' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-white/20">{s.label}</span>
                <span style={{ color: s.color }} className="font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Center — Speedometer */}
        <div className={`flex-1 flex flex-col items-center justify-center relative bg-[#080808] ${focusMode ? 'p-8' : ''}`}>
          {/* Target Pace Lightbar */}
          <div className={`w-full max-w-md mb-4 ${focusMode ? 'mb-8' : ''}`}>
            <div className="flex items-center justify-between text-[8px] font-mono text-white/30 mb-1">
              <span>TARGET PACE</span>
              <span style={{ color: targetPace.color }}>{targetPace.label}</span>
            </div>
            <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden flex">
              <div className="h-full transition-all" style={{ width: '33%', backgroundColor: '#3b82f6' }} />
              <div className="h-full transition-all" style={{ width: '33%', backgroundColor: '#22c55e' }} />
              <div className="h-full transition-all" style={{ width: '34%', backgroundColor: '#ef4444' }} />
              {/* Pace indicator */}
              <div 
                className="absolute h-4 w-0.5 bg-white shadow-lg transition-all"
                style={{ 
                  left: `${targetPace.zone === 'blue' ? '16%' : targetPace.zone === 'green' ? '50%' : '83%'}`,
                  transform: 'translateX(-50%)'
                }} 
              />
            </div>
          </div>
          {/* Big arc dial */}
          <div className={`relative flex items-center justify-center ${focusMode ? 'scale-125' : ''}`} style={{ width: 300, height: 260 }}>
            <BigArc value={telemetry.speed} max={40} color={speedColor} />
            <div className="relative z-10 text-center mt-6">
              <div className="font-display font-black leading-none" style={{
                fontSize: focusMode ? 120 : 80, color: speedColor,
                textShadow: speedColor === '#ef4444' ? '0 0 30px #ef444460' : '0 0 30px rgba(255,255,255,0.15)'
              }}>
                {telemetry.speed.toFixed(1)}
              </div>
              <div className={`font-mono text-white/25 tracking-[0.5em] mt-1 ${focusMode ? 'text-lg' : 'text-[10px]'}`}>MPH</div>
            </div>
          </div>

          {/* Throttle bar */}
          <div className="w-56 mt-2 mb-5">
            <div className="flex items-center justify-between text-[7px] font-mono text-white/20 mb-1">
              <span>THROTTLE INPUT</span>
              <span style={{ color: speedColor }}>{telemetry.efficiency.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${telemetry.efficiency}%`, background: 'linear-gradient(90deg, #22c55e 0%, #eab308 60%, #ef4444 100%)' }} />
            </div>
          </div>

          {/* Sub metrics - simplified in focus mode */}
          {!focusMode ? (
            <div className="flex items-center gap-5 flex-wrap justify-center max-w-xl">
              {[
                { label: 'BATT',  value: `${telemetry.battery.toFixed(0)}%`, sub: telemetry.battery > 40 ? 'GOOD' : 'LOW', color: battColor },
                { label: '48V SYSTEM', value: `${telemetry.voltage.toFixed(1)}V`, sub: telemetry.voltage > 44 ? '48V NOMINAL' : '48V SYSTEM', color: '#60a5fa' },
                { label: 'AMPS',  value: `${telemetry.current.toFixed(1)}A`, sub: 'CURRENT', color: '#22d3ee' },
                { label: 'MOTOR POWER', value: `${(telemetry.power != null ? telemetry.power : telemetry.current * telemetry.voltage).toFixed(0)}W`, sub: 'WATTS', color: '#a78bfa' },
                { label: 'HALL SPEED', value: `${(telemetry.speed_hall != null ? telemetry.speed_hall : telemetry.speed).toFixed(1)}`, sub: 'MPH', color: '#ef4444' },
                { label: 'GPS SPEED', value: `${(telemetry.speed_gps != null ? telemetry.speed_gps : telemetry.speed).toFixed(1)}`, sub: 'MPH', color: '#f59e0b' },
              ].map(m => (
                <div key={m.label} className="text-center px-1.5">
                  <div className="text-[7px] font-mono text-white/15 tracking-wider mb-0.5">{m.label}</div>
                  <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
                  {m.sub && <div className="text-[7px] font-mono text-white/20 mt-0.5">{m.sub}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-8 mt-8 flex-wrap justify-center">
              <div className="text-center">
                <div className="text-xl font-display font-black" style={{ color: battColor }}>{telemetry.battery.toFixed(0)}%</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">BATTERY</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-blue-400">{telemetry.voltage.toFixed(1)}V</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">48V SYSTEM</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-purple-400">{(telemetry.power != null ? telemetry.power : telemetry.current * telemetry.voltage).toFixed(0)}W</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">MOTOR POWER</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-red-400">{(telemetry.speed_hall != null ? telemetry.speed_hall : telemetry.speed).toFixed(1)}</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">HALL MPH</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-yellow-400">{(telemetry.speed_gps != null ? telemetry.speed_gps : telemetry.speed).toFixed(1)}</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">GPS MPH</div>
              </div>
            </div>
          )}

          {/* Oracle flash message */}
          {latestOracle && (
            <motion.div key={latestOracle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-5 px-4 py-2 rounded border text-[9px] font-mono max-w-xs text-center ${
                latestOracle.severity === 'critical' ? 'border-primary/25 bg-primary/5 text-primary' :
                latestOracle.severity === 'warning'  ? 'border-yellow-500/25 bg-yellow-500/5 text-yellow-400' :
                                                        'border-green-500/20 bg-green-500/5 text-green-400'
              }`}>
              <span className="opacity-40 mr-1">ORACLE</span>{latestOracle.text}
            </motion.div>
          )}

          {/* Status footer */}
          <div className="absolute bottom-3 text-[7px] font-mono text-white/10 tracking-widest flex items-center gap-3">
            <span>● TELEMETRY LIVE · 20Hz</span>
            <span>·</span>
            <span>ORACLE v2</span>
            <span>·</span>
            <span>{formatTime(telemetry.raceTime)}</span>
          </div>
        </div>

        {/* Right panel - hidden in focus mode */}
        {!focusMode && (
          <div className="w-52 flex-shrink-0 border-l border-white/[0.06] bg-[#0b0b0b] flex flex-col p-3 gap-3 overflow-y-auto">
          {/* Voltage + Current */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'VOLTAGE', value: `${telemetry.voltage.toFixed(1)}V`, color: '#60a5fa' },
              { label: 'CURRENT', value: `${telemetry.current.toFixed(1)}A`, color: '#a78bfa' },
            ].map(m => (
              <div key={m.label} className="rounded border border-white/[0.06] bg-[#0e0e0e] p-2.5 text-center">
                <div className="text-[7px] font-mono text-white/15 mb-1">{m.label}</div>
                <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Energy Cell */}
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[7px] font-mono text-white/15 tracking-widest">⚡ ENERGY CELL</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-display font-black" style={{ color: battColor }}>
                {telemetry.battery.toFixed(0)}
              </span>
              <span className="text-white/15 font-mono text-sm">%</span>
              <span className="ml-auto text-xs font-display font-bold text-blue-400">{telemetry.voltage.toFixed(1)}V</span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${telemetry.battery}%`, backgroundColor: battColor }} />
            </div>
            <div className="flex items-center justify-between text-[7px] font-mono text-white/20">
              <span>EST REMAINING —</span>
              <span className="text-green-400 font-bold">OPTIMAL</span>
            </div>
          </div>

          {/* Device Predictions */}
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
            <div className="text-[7px] font-display font-bold tracking-widest text-white/20 uppercase mb-2">Device Predictions</div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-primary text-xs flex-shrink-0">›</span>
                <span className="text-[8px] font-mono text-white/30 leading-snug">
                  Battery deficit projected in {(telemetry.battery / 8).toFixed(1)} laps.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 text-xs flex-shrink-0">›</span>
                <span className="text-[8px] font-mono text-white/30 leading-snug">
                  Thermal risk in {Math.max(0, (75 - telemetry.temp) / 1.5).toFixed(0)}m at current load.
                </span>
              </div>
            </div>
          </div>

          {/* Laps counter */}
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 mt-auto">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-[7px] font-mono text-white/15 mb-1">LAPS</div>
                <div className="text-2xl font-display font-black text-primary">{Math.floor(telemetry.lap)}</div>
              </div>
              <div>
                <div className="text-[7px] font-mono text-white/15 mb-1">REMAIN</div>
                <div className="text-2xl font-display font-black text-green-400">{telemetry.totalLaps - Math.floor(telemetry.lap)}</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}