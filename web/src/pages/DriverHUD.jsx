import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Radio, CheckCircle2, LayoutDashboard, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRealtimeTelemetry, COMMAND_STATUS } from '../hooks/useRealtimeTelemetry';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

const FLAG_CFG = {
  green:  { border: 'border-[#10B981]/30',  bg: 'bg-[#10B981]/10',  text: 'text-[#10B981]',  label: '● GREEN'  },
  yellow: { border: 'border-[#FFB300]/30', bg: 'bg-[#FFB300]/10', text: 'text-[#FFB300]', label: '● YELLOW' },
  red:    { border: 'border-[#FF1E42]/30',    bg: 'bg-[#FF1E42]/10',    text: 'text-[#FF1E42]',    label: '● RED — STOP', pulse: true },
  black:  { border: 'border-white/10',      bg: 'bg-white/5',       text: 'text-white/40',   label: '● BLACK'  },
};

const COMMANDS = [
  { label: 'BOX THIS LAP', color: '#FF1E42', border: '#FF1E4230' },
  { label: 'SAVE ENERGY',  color: '#10B981', border: '#10B98130' },
  { label: 'HOLD PACE',    color: '#FFB300', border: '#FFB30030' },
  { label: 'PUSH HARD',    color: '#FF1E42', border: '#FF1E4230' },
  { label: 'COOL DOWN',    color: '#8A909D', border: '#8A909D30' },
];

function BigArc({ value, max, color }) {
  // Defensive fallback
  const safeValue = value ?? 0;
  const safeMax = max ?? 100;
  const pct = Math.min(safeValue / safeMax, 1);
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

const FLAG_MODAL_CFG = {
  yellow: {
    bg: 'bg-[#FFD600]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'YELLOW FLAG',
    description: 'CAUTION ON TRACK · MAINTAIN POSITION · SLOW DOWN',
    buttonClass: 'bg-black text-yellow-400 hover:bg-neutral-900 border-2 border-black',
  },
  red: {
    bg: 'bg-[#FF1E42]',
    text: 'text-white',
    subText: 'text-white/90',
    title: 'RED FLAG — STOP',
    description: 'SESSION SUSPENDED · BOX IMMEDIATELY',
    buttonClass: 'bg-white text-[#FF1E42] hover:bg-neutral-100 border-2 border-white',
    pulse: true,
  },
  black: {
    bg: 'bg-black border-4 border-white',
    text: 'text-white',
    subText: 'text-white/80',
    title: 'BLACK FLAG',
    description: 'PENALTY / DISQUALIFICATION · RETURN TO PIT LANE',
    buttonClass: 'bg-white text-black hover:bg-neutral-200 border-2 border-white',
  },
  green: {
    bg: 'bg-[#00E676]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'GREEN FLAG',
    description: 'TRACK CLEAR · RACE PACE ACTIVE',
    buttonClass: 'bg-black text-[#00E676] hover:bg-neutral-900 border-2 border-black',
  },
};

const STRATEGY_MODAL_CFG = {
  AGGRESSIVE: {
    bg: 'bg-[#FF1E42]',
    text: 'text-white',
    subText: 'text-white/90',
    title: 'AGGRESSIVE',
    description: 'MAXIMUM POWER DEPLOYMENT · FULL ATTACK PACE',
    buttonClass: 'bg-white text-[#FF1E42] hover:bg-neutral-100 border-2 border-white',
  },
  BALANCED: {
    bg: 'bg-[#FFB300]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'BALANCED',
    description: 'OPTIMAL EFFICIENCY · MAINTAIN TARGET PACE',
    buttonClass: 'bg-black text-amber-400 hover:bg-neutral-900 border-2 border-black',
  },
  CONSERVE: {
    bg: 'bg-[#10B981]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'CONSERVE',
    description: 'ENERGY PRESERVATION MODE · LIFT AND COAST',
    buttonClass: 'bg-black text-emerald-400 hover:bg-neutral-900 border-2 border-black',
  },
};

export default function DriverHUD() {
  const navigate = useNavigate();
  const { logout } = usePasscodeAuth();
  const { telemetry, flag: localFlag, oracleMessages, commsMessages, formatTime, targetPace, signalLost, lastPacketTime } = useTelemetry();
  const {
    incomingCommands,
    sendAck,
    broadcastDriverStatus,
    driverTelemetry,
    driverStrategyMode,
  } = useRealtimeTelemetry('driver');
  const [focusMode, setFocusMode] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [lastAckedFlag, setLastAckedFlag] = useState(null);
  const [lastAckedStrategy, setLastAckedStrategy] = useState(null);

  // Descending 62-minute countdown timer (Electrathon 62-Minute Rule: 62:00 -> 00:00)
  const SESSION_DURATION_MS = 62 * 60 * 1000; // 62 minutes in milliseconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, currentTimestamp - sessionStartTime);
  const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);
  const remainingMinutes = Math.floor(remaining / 60000);
  const remainingSeconds = Math.floor((remaining % 60000) / 1000);
  const timeString = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  // Use flag from realtime broadcast / database if available, otherwise fall back to local state
  const flag = (driverTelemetry?.flag || localFlag || 'green').toLowerCase();
  const flagCfg = FLAG_CFG[flag] || FLAG_CFG.green;
  const flagModalCfg = FLAG_MODAL_CFG[flag] || FLAG_MODAL_CFG.green;
  const showFlagAlert = Boolean(flag && flag !== lastAckedFlag);

  // Strategy Mode Alert trigger
  const activeStrategy = (driverStrategyMode || telemetry?.strategy || 'BALANCED').toUpperCase();
  const strategyModalCfg = STRATEGY_MODAL_CFG[activeStrategy] || STRATEGY_MODAL_CFG.BALANCED;
  const showStrategyAlert = Boolean(activeStrategy && activeStrategy !== lastAckedStrategy);

  const latestOracle = oracleMessages[0];
  const pitMessages = commsMessages.filter(m => m.from === 'pit');

  // Defensive fallbacks for rapid 5 Hz telemetry updates
  const safeTelemetry = telemetry ?? {};
  const safeSpeed = safeTelemetry.speed ?? 0;
  const safeBattery = safeTelemetry.battery ?? 0;
  const safeTemp = safeTelemetry.temp ?? 0;
  const safeVoltage = safeTelemetry.voltage ?? 0;
  const safeCurrent = safeTelemetry.current ?? 0;
  const safePower = safeTelemetry.power ?? (safeCurrent * safeVoltage);
  const safeEfficiency = safeTelemetry.efficiency ?? 0;
  const safeLap = safeTelemetry.lap ?? 0;
  const safeRaceTime = safeTelemetry.raceTime ?? 0;
  const safeSpeedHall = safeTelemetry.speed_hall ?? safeSpeed;
  const safeSpeedGps = safeTelemetry.speed_gps ?? safeSpeed;

  // Broadcast driver status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      broadcastDriverStatus(safeTelemetry, incomingCommands[0]);
    }, 1000);
    return () => clearInterval(interval);
  }, [safeTelemetry, incomingCommands, broadcastDriverStatus]);

  const battColor = safeBattery < 20 ? '#FF1E42' : safeBattery < 40 ? '#FFB300' : '#10B981';
  const tempColor = safeTemp > 58 ? '#FF1E42' : safeTemp > 46 ? '#FFB300' : '#10B981';
  const speedColor = safeSpeed > 32 ? '#FF1E42' : '#10B981';

  // Time since last packet for signal status
  const timeSinceLastPacket = Math.floor((Date.now() - lastPacketTime) / 1000);
  const signalStatus = signalLost ? 'LOST' : timeSinceLastPacket < 2 ? 'EXCELLENT' : timeSinceLastPacket < 5 ? 'GOOD' : 'DEGRADED';
  const signalColor = signalLost ? '#ef4444' : timeSinceLastPacket < 2 ? '#22c55e' : timeSinceLastPacket < 5 ? '#eab308' : '#f97316';

  // Current incoming command
  const activeCmd = incomingCommands[0];
  const cmdPayloadText = activeCmd
    ? (activeCmd.payload || activeCmd.commandText || activeCmd.command_name || activeCmd.text || activeCmd.type || 'INCOMING COMMAND')
    : '';

  // Command banner color based on actual command payload
  const getCommandColor = (commandText) => {
    const upper = String(commandText || '').toUpperCase();
    if (upper.includes('BOX')) return { bg: 'bg-[#FF1E42]/20', border: 'border-[#FF1E42]', text: 'text-[#FF1E42]', btnBg: 'bg-[#FF1E42]', btnText: 'text-white' };
    if (upper.includes('PACE DOWN') || upper.includes('HOLD')) return { bg: 'bg-[#FFB300]/20', border: 'border-[#FFB300]', text: 'text-[#FFB300]', btnBg: 'bg-[#FFB300]', btnText: 'text-black' };
    if (upper.includes('TARGET') || upper.includes('SAVE')) return { bg: 'bg-[#10B981]/20', border: 'border-[#10B981]', text: 'text-[#10B981]', btnBg: 'bg-[#10B981]', btnText: 'text-black' };
    if (upper.includes('PUSH')) return { bg: 'bg-[#FF1E42]/20', border: 'border-[#FF1E42]', text: 'text-[#FF1E42]', btnBg: 'bg-[#FF1E42]', btnText: 'text-white' };
    return { bg: 'bg-[#FF1E42]/20', border: 'border-[#FF1E42]', text: 'text-[#FF1E42]', btnBg: 'bg-[#FF1E42]', btnText: 'text-white' };
  };

  const handleAck = (commandId, commandText) => {
    sendAck(commandId, commandText);
  };

  const handleAckFlag = () => {
    setLastAckedFlag(flag);
  };

  const handleAckStrategy = () => {
    setLastAckedStrategy(activeStrategy);
  };

  return (
    <div className={`min-h-screen bg-[#08090C] text-foreground flex flex-col overflow-hidden select-none ${focusMode ? 'fullscreen' : ''}`}>
      {/* Command Banner Overlay with Clickable Touch Target */}
      <AnimatePresence>
        {activeCmd && activeCmd.status !== COMMAND_STATUS.EXPIRED && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            onClick={() => handleAck(activeCmd.id, cmdPayloadText)}
            className={`fixed top-0 left-0 right-0 z-40 p-4 border-b-2 cursor-pointer shadow-2xl transition-all ${getCommandColor(cmdPayloadText).bg} ${getCommandColor(cmdPayloadText).border}`}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${getCommandColor(cmdPayloadText).border.replace('border-', 'bg-')}`} />
                <div>
                  <div className={`text-[10px] font-mono tracking-widest ${getCommandColor(cmdPayloadText).text} uppercase font-bold`}>
                    {activeCmd.sender || 'PIT'} COMMAND DIRECTIVE
                  </div>
                  <div className={`text-xl md:text-2xl font-display font-black tracking-wider ${getCommandColor(cmdPayloadText).text}`}>
                    {cmdPayloadText}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAck(activeCmd.id, cmdPayloadText);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 text-sm font-display font-black tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer ${getCommandColor(cmdPayloadText).btnBg} ${getCommandColor(cmdPayloadText).btnText} ${getCommandColor(cmdPayloadText).border}`}
              >
                <CheckCircle2 className="w-5 h-5" />
                ACKNOWLEDGE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Massive Fullscreen Flag Alert Overlay (Task 6) */}
      <AnimatePresence>
        {showFlagAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={handleAckFlag}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer ${flagModalCfg.bg}`}
          >
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-black tracking-widest mb-4 uppercase ${flagModalCfg.text} ${flagModalCfg.pulse ? 'animate-pulse' : ''}`}>
                {flag.toUpperCase()} FLAG
              </div>
              <div className={`text-lg sm:text-2xl md:text-3xl font-mono font-bold tracking-wider mb-8 uppercase ${flagModalCfg.subText}`}>
                {flagModalCfg.description}
              </div>
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAckFlag();
                  }}
                  className={`w-full py-6 md:py-8 rounded-2xl font-display font-black text-xl md:text-2xl tracking-widest uppercase transition-all shadow-2xl active:scale-95 cursor-pointer ${flagModalCfg.buttonClass}`}
                >
                  TAP TO ACKNOWLEDGE FLAG
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Massive Strategy/Mode Alert Overlay (Task 7) */}
      <AnimatePresence>
        {showStrategyAlert && activeStrategy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleAckStrategy}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer ${strategyModalCfg.bg}`}
          >
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className={`text-sm md:text-base font-mono font-bold tracking-[0.3em] uppercase mb-3 ${strategyModalCfg.subText}`}>
                PIT STRATEGY DIRECTIVE
              </div>
              <div className={`text-6xl sm:text-8xl md:text-9xl font-display font-black tracking-widest mb-4 uppercase ${strategyModalCfg.text}`}>
                {activeStrategy}
              </div>
              <div className={`text-lg sm:text-2xl md:text-3xl font-mono font-bold tracking-wider mb-8 uppercase ${strategyModalCfg.subText}`}>
                {strategyModalCfg.description}
              </div>
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAckStrategy();
                  }}
                  className={`w-full py-6 md:py-8 rounded-2xl font-display font-black text-xl md:text-2xl tracking-widest uppercase transition-all shadow-2xl active:scale-95 cursor-pointer ${strategyModalCfg.buttonClass}`}
                >
                  ACKNOWLEDGE MODE CHANGE
                </button>
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
        <div className="flex-shrink-0 flex items-center justify-between px-4 h-9 border-b border-white/[0.06] bg-[#08090C]">
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
            <span className="text-white/25">LAP <span className="text-white/60 font-bold">#{Math.floor(safeLap)}</span></span>
            <span className="text-[#FF1E42] font-bold tracking-widest">{timeString}</span>
            <span style={{ color: battColor }} className="font-bold">{safeBattery < 40 ? 'CONSERVE' : safeBattery > 60 ? 'BALANCED' : 'NOMINAL'}</span>
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

      <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
        {/* Left panel - hidden in focus mode */}
        {!focusMode && (
          <div className="w-full md:w-44 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] bg-[#101217] flex flex-col overflow-y-auto p-3 gap-3">
          {/* Driver Commands */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Radio className="w-2.5 h-2.5 text-white/20" />
              <span className="text-[7px] font-mono tracking-widest text-white/30 uppercase">Driver Commands</span>
            </div>
            <div className="space-y-1">
              {COMMANDS.map(cmd => (
                <button key={cmd.label}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded border text-[10px] font-display font-bold tracking-wider transition-all hover:opacity-90 active:scale-95"
                  style={{ borderColor: cmd.border, background: `${cmd.color}08`, color: cmd.color }}>
                  {cmd.label}
                  <span className="opacity-30">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ghost-Link Feed */}
          <div className="border-t border-white/[0.06] pt-3">
            <div className="text-[7px] font-mono text-white/25 tracking-widest mb-1">((●)) GHOST-LINK™ FEED</div>
            <div className="text-[7px] font-mono text-primary/70 mb-2 tracking-widest">((●)) PRIORITY ALERTS</div>
            {pitMessages.length === 0 ? (
              <p className="text-[8px] font-mono text-white/20 text-center py-3">No active alerts</p>
            ) : pitMessages.slice(-3).map((m, i) => (
              <div key={i} className="text-[8px] font-mono text-white/60 border border-white/[0.06] bg-[#08090C] rounded px-2 py-1 mb-1">{m.text}</div>
            ))}
          </div>

          {/* Predictive Lap Engine */}
          <div className="border-t border-white/[0.06] pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[7px] font-mono text-white/25 tracking-widest">⚡ PREDICTIVE LAP</span>
              <span className="text-[7px] font-mono px-1 rounded border border-[#FFB300]/30 text-[#FFB300] bg-[#FFB300]/10">ON PACE</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <div>
                <div className="text-[6px] font-mono text-white/25 mb-1">PROJ LAP</div>
                <div className="text-base font-display font-black text-[#FFB300]">—</div>
              </div>
              <div>
                <div className="text-[6px] font-mono text-white/25 mb-1">Δ VS PB</div>
                <div className="text-base font-display font-black text-white/40">—</div>
              </div>
            </div>
            <div className="flex justify-around text-[6px] font-mono text-white/30">
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
          <div className="border-t border-white/[0.06] pt-3 space-y-1">
            <div className="text-[7px] font-display font-bold tracking-widest text-white/30 uppercase mb-2">Lap Timing</div>
            {[
              { label: 'LAPS', value: Math.floor(safeLap), color: '#FF1E42' },
              { label: 'DIST', value: `${(safeLap * 0.25).toFixed(2)} mi`, color: '#FFB300' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-white/30">{s.label}</span>
                <span style={{ color: s.color }} className="font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Center — Speedometer */}
        <div className={`flex-1 flex flex-col items-center justify-center relative bg-[#08090C] ${focusMode ? 'p-8' : 'p-4 md:p-6'}`}>
          {/* Target Pace Lightbar */}
          <div className={`w-full max-w-md mb-4 ${focusMode ? 'mb-8' : ''}`}>
            <div className="flex items-center justify-between text-[8px] font-mono text-white/30 mb-1">
              <span>TARGET PACE</span>
              <span style={{ color: targetPace.color }}>{targetPace.label}</span>
            </div>
            <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden flex relative">
              <div className="h-full transition-all" style={{ width: '33%', backgroundColor: '#10B981' }} />
              <div className="h-full transition-all" style={{ width: '33%', backgroundColor: '#FFB300' }} />
              <div className="h-full transition-all" style={{ width: '34%', backgroundColor: '#FF1E42' }} />
              {/* Pace indicator */}
              <div 
                className="absolute h-4 top-1/2 -translate-y-1/2 w-1 bg-white shadow-lg transition-all rounded-full"
                style={{ 
                  left: `${targetPace.zone === 'blue' || targetPace.zone === 'green' ? '20%' : targetPace.zone === 'yellow' ? '50%' : '80%'}`,
                  transform: 'translateX(-50%) translateY(-50%)'
                }} 
              />
            </div>
          </div>
          {/* Big arc dial */}
          <div className={`relative flex items-center justify-center ${focusMode ? 'scale-125' : ''}`} style={{ width: 300, height: 260 }}>
            <BigArc value={safeSpeed} max={40} color={speedColor} />
            <div className="relative z-10 text-center mt-6">
              <div className="font-display font-black leading-none" style={{
                fontSize: focusMode ? 120 : 80, color: speedColor,
                textShadow: speedColor === '#FF1E42' ? '0 0 30px #FF1E4260' : '0 0 30px rgba(16,185,129,0.2)'
              }}>
                {safeSpeed.toFixed(1)}
              </div>
              <div className={`font-mono text-white/30 tracking-[0.5em] mt-1 ${focusMode ? 'text-lg' : 'text-[10px]'}`}>MPH</div>
            </div>
          </div>

          {/* Throttle bar */}
          <div className="w-56 mt-2 mb-5">
            <div className="flex items-center justify-between text-[7px] font-mono text-white/30 mb-1">
              <span>THROTTLE INPUT</span>
              <span style={{ color: speedColor }}>{safeEfficiency.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${safeEfficiency}%`, background: 'linear-gradient(90deg, #10B981 0%, #FFB300 60%, #FF1E42 100%)' }} />
            </div>
          </div>

          {/* Sub metrics - simplified in focus mode */}
          {!focusMode ? (
            <div className="flex items-center gap-5 flex-wrap justify-center max-w-xl">
              {[
                { label: 'BATT',  value: `${safeBattery.toFixed(0)}%`, sub: safeBattery > 40 ? 'GOOD' : 'LOW', color: battColor },
                { label: '48V SYSTEM', value: `${safeVoltage.toFixed(1)}V`, sub: safeVoltage > 44 ? '48V NOMINAL' : '48V SAG', color: '#FF1E42' },
                { label: 'AMPS',  value: `${safeCurrent.toFixed(1)}A`, sub: 'CURRENT', color: '#FF1E42' },
                { label: 'MOTOR POWER', value: `${safePower.toFixed(0)}W`, sub: 'WATTS', color: '#FF1E42' },
                { label: 'HALL SPEED', value: `${safeSpeedHall.toFixed(1)}`, sub: 'MPH', color: '#FF1E42' },
                { label: 'GPS SPEED', value: `${safeSpeedGps.toFixed(1)}`, sub: 'MPH', color: '#FFB300' },
              ].map(m => (
                <div key={m.label} className="text-center px-1.5">
                  <div className="text-[7px] font-mono text-white/30 tracking-wider mb-0.5">{m.label}</div>
                  <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
                  {m.sub && <div className="text-[7px] font-mono text-white/25 mt-0.5">{m.sub}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-8 mt-8 flex-wrap justify-center">
              <div className="text-center">
                <div className="text-xl font-display font-black" style={{ color: battColor }}>{safeBattery.toFixed(0)}%</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">BATTERY</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-[#FF1E42]">{safeVoltage.toFixed(1)}V</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">48V SYSTEM</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-[#FF1E42]">{safePower.toFixed(0)}W</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">MOTOR POWER</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-[#FF1E42]">{safeSpeedHall.toFixed(1)}</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">HALL MPH</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-black text-[#FFB300]">{safeSpeedGps.toFixed(1)}</div>
                <div className="text-[8px] font-mono text-white/30 mt-1">GPS MPH</div>
              </div>
            </div>
          )}

          {/* Oracle flash message */}
          {latestOracle && (
            <motion.div key={latestOracle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-5 px-4 py-2 rounded border text-[9px] font-mono max-w-xs text-center ${
                latestOracle.severity === 'critical' ? 'border-[#FF1E42]/40 bg-[#FF1E42]/10 text-[#FF1E42]' :
                latestOracle.severity === 'warning'  ? 'border-[#FFB300]/40 bg-[#FFB300]/10 text-[#FFB300]' :
                                                        'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
              }`}>
              <span className="opacity-40 mr-1">ORACLE</span>{latestOracle.text}
            </motion.div>
          )}

          {/* Status footer */}
          <div className="absolute bottom-3 text-[7px] font-mono text-white/20 tracking-widest flex items-center gap-3">
            <span>● TELEMETRY LIVE · 20Hz</span>
            <span>·</span>
            <span>ORACLE v2</span>
            <span>·</span>
            <span>{formatTime(safeRaceTime)}</span>
          </div>
        </div>

        {/* Right panel - hidden in focus mode */}
        {!focusMode && (
          <div className="w-full md:w-52 flex-shrink-0 border-t md:border-t-0 md:border-l border-white/[0.06] bg-[#101217] flex flex-col p-3 gap-3 overflow-y-auto">
          {/* Voltage + Current */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'VOLTAGE', value: `${safeVoltage.toFixed(1)}V`, color: '#FF1E42' },
              { label: 'CURRENT', value: `${safeCurrent.toFixed(1)}A`, color: '#FF1E42' },
            ].map(m => (
              <div key={m.label} className="rounded border border-white/[0.06] bg-[#08090C] p-2.5 text-center">
                <div className="text-[7px] font-mono text-white/25 mb-1">{m.label}</div>
                <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Energy Cell */}
          <div className="rounded border border-white/[0.06] bg-[#08090C] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[7px] font-mono text-white/25 tracking-widest">⚡ ENERGY CELL</span>
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-display font-black" style={{ color: battColor }}>
                {safeBattery.toFixed(0)}
              </span>
              <span className="text-white/20 font-mono text-sm">%</span>
              <span className="ml-auto text-xs font-display font-bold text-[#FF1E42]">{safeVoltage.toFixed(1)}V</span>
            </div>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${safeBattery}%`, backgroundColor: battColor }} />
            </div>
            <div className="flex items-center justify-between text-[7px] font-mono text-white/30">
              <span>EST REMAINING —</span>
              <span className="text-[#10B981] font-bold">OPTIMAL</span>
            </div>
          </div>

          {/* Device Predictions */}
          <div className="rounded border border-white/[0.06] bg-[#08090C] p-3">
            <div className="text-[7px] font-display font-bold tracking-widest text-white/30 uppercase mb-2">Device Predictions</div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[#FF1E42] text-xs flex-shrink-0">›</span>
                <span className="text-[8px] font-mono text-white/40 leading-snug">
                  Runtime margin: {(Math.max(0, safeBattery - 15) * 0.8).toFixed(1)}m at current discharge.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FFB300] text-xs flex-shrink-0">›</span>
                <span className="text-[8px] font-mono text-white/40 leading-snug">
                  Thermal headroom: {Math.max(0, 65 - safeTemp).toFixed(0)}°C to safety limit.
                </span>
              </div>
            </div>
          </div>

          {/* Laps counter - removed REMAIN as per Electrathon 62-minute rule */}
          <div className="rounded border border-white/[0.06] bg-[#08090C] p-3 mt-auto">
            <div className="text-center">
              <div className="text-[7px] font-mono text-white/25 mb-1">COMPLETED LAPS</div>
              <div className="text-3xl font-display font-black text-[#FF1E42]">{Math.floor(safeLap)}</div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}