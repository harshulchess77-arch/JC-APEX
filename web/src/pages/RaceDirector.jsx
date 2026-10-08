import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Timer, LogOut, LayoutDashboard, Car, Flag as FlagIcon, AlertTriangle, CheckCircle2, TrendingDown, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRealtimeTelemetry, COMMAND_TYPES, COMMAND_STATUS } from '../hooks/useRealtimeTelemetry';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';
import FlagPanel from '../components/command/FlagPanel';

const FLAG_STYLES = {
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-500',  dot: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  red:    { bg: 'bg-primary/10',    border: 'border-primary/30',    text: 'text-primary',    dot: 'bg-primary' },
  black:  { bg: 'bg-secondary',     border: 'border-border',        text: 'text-foreground', dot: 'bg-foreground' },
};

function MiniChart({ data, dataKey, color }) {
  const colorHex = { red: '#FF1E42', green: '#10B981', yellow: '#FFB300', blue: '#FF1E42', white: '#f5f5f5' };
  const hex = colorHex[color] || '#FF1E42';
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data.slice(-40)}>
        <defs>
          <linearGradient id={`dc-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hex} stopOpacity={0.25} />
            <stop offset="100%" stopColor={hex} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={hex} strokeWidth={1.5} fill={`url(#dc-${dataKey})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatusCard({ label, value, unit, color, trend, chart, data, dataKey }) {
  const colorMap = {
    green: 'text-[#10B981]', yellow: 'text-[#FFB300]', red: 'text-[#FF1E42]',
    blue: 'text-[#FF1E42]', white: 'text-foreground',
  };
  return (
    <div className="rounded border border-border bg-card/30 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-widest text-muted-foreground/50 uppercase">{label}</span>
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-primary/60" />}
        {trend === 'up' && <Activity className="w-3 h-3 text-green-500/60" />}
      </div>
      <div className={`text-3xl font-mono font-black ${colorMap[color]}`}>
        {typeof value === 'number' ? value.toFixed(value > 10 ? 1 : 2) : value}
        <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
      </div>
      {chart && data && <MiniChart data={data} dataKey={dataKey} color={color} />}
    </div>
  );
}

export default function RaceDirector() {
  const navigate = useNavigate();
  const { logout } = usePasscodeAuth();
  const { telemetry, flag, setFlag, oracleMessages, chartData, formatTime } = useTelemetry();
  const { commandHistory, sendCommand: realtimeSendCommand } = useRealtimeTelemetry('director');
  const flagStyle = FLAG_STYLES[flag] || FLAG_STYLES.green;

  const handleSendCommand = (commandText) => {
    let commandType;
    if (commandText === 'BOX THIS LAP') commandType = COMMAND_TYPES.BOX_THIS_LAP;
    else if (commandText === 'PACE DOWN') commandType = COMMAND_TYPES.PACE_DOWN;
    else if (commandText.includes('TARGET')) commandType = COMMAND_TYPES.TARGET_PACE;
    else if (commandText === 'PUSH HARD') commandType = COMMAND_TYPES.PUSH_HARD;
    else commandType = 'COMMAND';

    realtimeSendCommand(commandType, commandText);
  };

  const systemHealth = [
    { label: 'Battery', ok: telemetry.battery > 25, val: `${telemetry.battery.toFixed(0)}%` },
    { label: 'Thermal', ok: telemetry.temp < 58, val: `${telemetry.temp.toFixed(0)}°C` },
    { label: 'Voltage', ok: telemetry.voltage > 40, val: `${telemetry.voltage.toFixed(1)}V` },
    { label: 'Efficiency', ok: telemetry.efficiency > 60, val: `${telemetry.efficiency.toFixed(0)}%` },
    { label: 'Current', ok: telemetry.current < 22, val: `${telemetry.current.toFixed(1)}A` },
    { label: 'Speed', ok: true, val: `${telemetry.speed.toFixed(0)} km/h` },
  ];

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-[1800px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="font-sans font-black text-lg">JC <span className="text-primary">APEX</span></span>
            <div className="hidden sm:flex items-center gap-1">
              <button onClick={() => navigate('/pit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <LayoutDashboard className="w-3 h-3" /> PIT CENTER
              </button>
              <button onClick={() => navigate('/driver')} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Car className="w-3 h-3" /> DRIVER HUD
              </button>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-bold">
                <FlagIcon className="w-3 h-3" /> DIRECTOR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-green-500 font-bold">LIVE</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-secondary/20 text-xs font-mono">
              <Timer className="w-3 h-3 text-muted-foreground" />
              <span className="text-foreground font-bold">{formatTime(telemetry.raceTime)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-secondary/20 text-xs font-mono text-muted-foreground">
              LAP <span className="text-foreground font-bold ml-1">{Math.floor(telemetry.lap)}</span>/{telemetry.totalLaps}
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto p-3 space-y-3">

        {/* Active flag banner */}
        <div className={`flex items-center justify-between px-5 py-3 rounded border ${flagStyle.border} ${flagStyle.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${flagStyle.dot} animate-pulse`} />
            <span className={`text-sm font-mono font-bold tracking-wider ${flagStyle.text}`}>
              ACTIVE FLAG: {flag.toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground/50">Race Director Control</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Overview metrics */}
          <div className="lg:col-span-8 space-y-3">
            {/* Primary telemetry cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatusCard label="Speed" value={telemetry.speed} unit="km/h" color="white" trend="up" chart data={chartData} dataKey="speed" />
              <StatusCard label="Battery" value={telemetry.battery} unit="%" color={telemetry.battery < 25 ? 'red' : 'green'} trend="down" chart data={chartData} dataKey="battery" />
              <StatusCard label="Motor Temp" value={telemetry.temp} unit="°C" color={telemetry.temp > 55 ? 'red' : 'yellow'} trend="up" chart data={chartData} dataKey="temp" />
            </div>

            {/* Secondary row */}
            <div className="grid grid-cols-3 gap-3">
              <StatusCard label="Voltage" value={telemetry.voltage} unit="V" color="yellow" />
              <StatusCard label="Current" value={telemetry.current} unit="A" color="blue" />
              <StatusCard label="Efficiency" value={telemetry.efficiency} unit="%" color={telemetry.efficiency > 75 ? 'green' : 'yellow'} />
            </div>

            {/* System health grid */}
            <div className="rounded border border-border bg-card/20 p-4">
              <div className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase mb-3">
                System Health Monitor
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {systemHealth.map(s => (
                  <div key={s.label} className={`flex items-center justify-between px-3 py-2 rounded border ${s.ok ? 'border-green-500/20 bg-green-500/5' : 'border-primary/30 bg-primary/5'}`}>
                    <div className="flex items-center gap-2">
                      {s.ok
                        ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                        : <AlertTriangle className="w-3 h-3 text-primary animate-pulse" />
                      }
                      <span className="text-xs font-mono text-muted-foreground/70">{s.label}</span>
                    </div>
                    <span className={`text-xs font-mono font-bold ${s.ok ? 'text-green-500' : 'text-primary'}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Oracle log */}
            <div className="rounded border border-border bg-card/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-red" />
                <span className="text-[10px] font-mono tracking-widest text-primary/70 uppercase font-bold">Oracle Intelligence Log</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {oracleMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 px-3 py-2 rounded border text-xs font-mono ${
                      msg.severity === 'critical' ? 'border-primary/25 bg-primary/5 text-primary' :
                      msg.severity === 'warning' ? 'border-yellow-500/25 bg-yellow-500/5 text-yellow-500' :
                      'border-green-500/25 bg-green-500/5 text-green-500'
                    }`}
                  >
                    <span className="opacity-40 flex-shrink-0">{msg.time}</span>
                    <span>{msg.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Flag control */}
          <div className="lg:col-span-4 space-y-3">
            <FlagPanel activeFlag={flag} onFlagChange={setFlag} />

            {/* Director Quick Commands */}
            <div className="rounded border border-border bg-card/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-3 h-3 text-primary/60" />
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase">Director Commands</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleSendCommand('BOX THIS LAP')}
                  className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20">
                  BOX THIS LAP
                </button>
                <button onClick={() => handleSendCommand('PACE DOWN')}
                  className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20">
                  PACE DOWN
                </button>
                <button onClick={() => handleSendCommand('TARGET PACE: 25 MPH')}
                  className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20">
                  TARGET 25 MPH
                </button>
                <button onClick={() => handleSendCommand('PUSH HARD')}
                  className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-[#FF1E42]/10 border border-[#FF1E42]/30 text-[#FF1E42] hover:bg-[#FF1E42]/20">
                  PUSH HARD
                </button>
              </div>
            </div>

            {/* Driver Response Status */}
            <div className="rounded border border-border bg-card/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-3 h-3 text-green-500/60" />
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase">Driver Response Status</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {commandHistory.length === 0 ? (
                  <div className="text-[8px] font-mono text-muted-foreground/50 text-center py-2">No commands sent</div>
                ) : (
                  commandHistory.slice(-5).reverse().map(cmd => (
                    <div key={cmd.id} className={`flex items-center justify-between px-2 py-1.5 rounded text-[8px] font-mono border ${
                      cmd.status === COMMAND_STATUS.ACKNOWLEDGED 
                        ? 'border-green-500/30 bg-green-500/5 text-green-500' 
                        : cmd.status === COMMAND_STATUS.SENT
                        ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500'
                        : 'border-border bg-secondary/30 text-muted-foreground/50'
                    }`}>
                      <span className="truncate max-w-[120px]">{cmd.payload}</span>
                      <span className="flex items-center gap-1">
                        {cmd.status === COMMAND_STATUS.ACKNOWLEDGED && <CheckCircle2 className="w-3 h-3" />}
                        {cmd.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lap progress */}
            <div className="rounded border border-border bg-card/20 p-4">
              <div className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase mb-3">Race Progress</div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-mono font-black text-foreground">{Math.floor(telemetry.lap)}</span>
                <span className="text-sm font-mono text-muted-foreground/50">/ {telemetry.totalLaps} laps</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  animate={{ width: `${(telemetry.lap / telemetry.totalLaps) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] font-mono text-muted-foreground/30">
                <span>START</span>
                <span>{((telemetry.lap / telemetry.totalLaps) * 100).toFixed(0)}% complete</span>
                <span>FINISH</span>
              </div>
            </div>

            {/* Race time */}
            <div className="rounded border border-border bg-card/20 p-4 text-center">
              <div className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase mb-2">Race Time</div>
              <div className="text-4xl font-mono font-black text-primary glow-red-text">
                {formatTime(telemetry.raceTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}