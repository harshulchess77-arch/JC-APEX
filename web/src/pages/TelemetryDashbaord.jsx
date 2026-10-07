import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Zap, Battery, Gauge, Radio, Signal } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';

const tip = { contentStyle: { background: '#0B0E14', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, borderRadius: 4 }, labelStyle: { color: '#fff' } };

function LiveMetricPanel({ label, value, unit, color, max, data, dataKey }) {
  // Defensive fallbacks for rapid 5 Hz telemetry updates
  const safeValue = value ?? 0;
  const safeMax = max ?? 100;
  const safeData = data ?? [];
  const safeDataKey = dataKey ?? 'value';
  const pct = Math.min((safeValue / safeMax) * 100, 100);
  return (
    <div className="rounded border border-white/[0.06] bg-[#0B0E14] p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">{label}</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-[7px] font-mono text-white/15">LIVE</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-display font-black" style={{ color, textShadow: `0 0 12px ${color}50` }}>{typeof safeValue === 'number' ? safeValue.toFixed(1) : safeValue}</span>
        <span className="text-[9px] font-mono text-white/20">{unit}</span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {safeData?.length > 0 && (
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeData}>
              <defs>
                <linearGradient id={`g${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={safeDataKey} stroke={color} strokeWidth={1.5} fill={`url(#g${label})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label, value, unit, color, icon: Icon }) {
  const safeValue = value ?? 0;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/[0.08] bg-[#0B0E14]/50">
      {Icon && <Icon className="w-3 h-3" style={{ color }} />}
      <span className="text-[7px] font-mono text-white/40 uppercase">{label}</span>
      <span className="text-[8px] font-mono font-bold" style={{ color }}>{typeof safeValue === 'number' ? safeValue.toFixed(1) : safeValue}</span>
      <span className="text-[7px] font-mono text-white/30">{unit}</span>
    </div>
  );
}

export default function TelemetryDashboard() {
  const navigate = useNavigate();
  // LIVE HARDWARE MODE - will show actual data from your Heltec V3 hardware
  const { telemetry, chartData, formatTime, power, estimatedLapsRemaining, thermalAlert, voltageAlert, hardwareData, isLive } = useTelemetry(
    null,  // sessionId (null = listen to all sessions)
    true,  // enabled
    { isDemoMode: false }  // FALSE = Live Hardware Mode (actual data from LoRa)
  );

  // Defensive fallbacks for telemetry data
  const safeTelemetry = telemetry ?? {};
  const safeHardwareData = hardwareData ?? {};
  const safeChartData = chartData ?? [];
  const safePower = power ?? 0;
  const safeEstimatedLaps = estimatedLapsRemaining ?? 0;

  const throttleData = safeChartData.map(d => ({ ...d, throttle: d.efficiency ?? 0 }));

  // F1 Color Palette
  const colors = {
    neonGreen: '#00FF66',
    vividRed: '#FF0033',
    signalYellow: '#FFD600',
    signalOrange: '#FF6B00',
    carbonDark: '#0B0E14',
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0B0E14] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Activity className="w-4 h-4" style={{ color: colors.neonGreen }} />
          <span className="font-display font-black text-sm tracking-widest text-white">TELEMETRY DASHBOARD</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono">
          <div className="flex items-center gap-1.5" style={{ color: colors.neonGreen }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.neonGreen }} />
            LIVE · 5Hz
          </div>
          <span className="text-white/20">{formatTime(safeTelemetry.raceTime ?? 0)}</span>
          {/* Thermal Alert Badge */}
          <div className={`px-2 py-0.5 rounded text-[7px] font-bold ${thermalAlert?.flashing ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${thermalAlert?.color}20`, color: thermalAlert?.color, border: `1px solid ${thermalAlert?.color}40` }}>
            TEMP: {thermalAlert?.level?.toUpperCase() ?? 'NOMINAL'}
          </div>
          {/* Voltage Alert Badge */}
          <div className={`px-2 py-0.5 rounded text-[7px] font-bold ${voltageAlert?.flashing ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${voltageAlert?.color}20`, color: voltageAlert?.color, border: `1px solid ${voltageAlert?.color}40` }}>
            VOLT: {voltageAlert?.level?.toUpperCase() ?? 'NOMINAL'}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Live Telemetry Status Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="Power" value={safePower / 1000} unit="kW" color={colors.neonGreen} icon={Zap} />
          <StatusBadge label="Voltage" value={safeTelemetry.voltage} unit="V" color={colors.neonGreen} icon={Battery} />
          <StatusBadge label="Current" value={safeTelemetry.current} unit="A" color={colors.neonGreen} icon={Gauge} />
          <StatusBadge label="Hall Spd" value={safeTelemetry.speed_hall} unit="mph" color={colors.signalYellow} icon={Radio} />
          <StatusBadge label="GPS Spd" value={safeTelemetry.speed_gps} unit="mph" color={colors.signalYellow} icon={Radio} />
          <StatusBadge label="RSSI" value={safeHardwareData.rssi} unit="dBm" color={safeHardwareData.rssi < -70 ? colors.vividRed : colors.neonGreen} icon={Signal} />
          <StatusBadge label="SNR" value={safeHardwareData.snr} unit="dB" color={safeHardwareData.snr < 5 ? colors.vividRed : colors.neonGreen} icon={Signal} />
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-3 gap-3">
          <LiveMetricPanel label="Speed"      value={safeTelemetry.speed}      unit="mph" color={colors.vividRed} max={40}  data={safeChartData} dataKey="speed" />
          <LiveMetricPanel label="Battery"    value={safeTelemetry.battery}    unit="%"   color={colors.neonGreen} max={100} data={safeChartData} dataKey="battery" />
          <LiveMetricPanel label="Temp"       value={safeTelemetry.temp}       unit="°C"  color={colors.signalYellow} max={80}  data={safeChartData} dataKey="temp" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <LiveMetricPanel label="Efficiency" value={safeTelemetry.efficiency} unit="%"   color="#a78bfa" max={100} data={safeChartData} dataKey="efficiency" />
          <LiveMetricPanel label="Voltage"    value={safeTelemetry.voltage}    unit="V"   color="#60a5fa" max={50}  data={safeChartData} dataKey="voltage" />
          <LiveMetricPanel label="Current"    value={safeTelemetry.current}    unit="A"   color="#22d3ee" max={20}  />
        </div>
        {/* Power and Laps Remaining */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border border-white/[0.06] bg-[#0B0E14] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Power Output</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: colors.neonGreen }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black" style={{ color: colors.neonGreen }}>{safePower.toFixed(0)}</span>
              <span className="text-[9px] font-mono text-white/20">Watts</span>
            </div>
            <div className="text-[7px] font-mono text-white/15 mt-1">V × I = {(safeTelemetry.voltage ?? 0).toFixed(1)}V × {(safeTelemetry.current ?? 0).toFixed(1)}A</div>
          </div>
          <div className="rounded border border-white/[0.06] bg-[#0B0E14] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Est. Laps Remaining</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: colors.neonGreen }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black" style={{ color: colors.neonGreen }}>{safeEstimatedLaps}</span>
              <span className="text-[9px] font-mono text-white/20">laps</span>
            </div>
            <div className="text-[7px] font-mono text-white/15 mt-1">At current discharge rate</div>
          </div>
        </div>

        {/* Throttle position */}
        <div className="rounded border border-white/[0.06] bg-[#0B0E14] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Throttle Position — Live</span>
            <span className="text-xl font-display font-black" style={{ color: colors.neonGreen }}>{(safeTelemetry.efficiency ?? 0).toFixed(0)}%</span>
          </div>
          <div className="h-8 bg-white/[0.03] rounded-lg overflow-hidden mb-2">
            <div className="h-full rounded-lg transition-all duration-300"
              style={{ width: `${safeTelemetry.efficiency ?? 0}%`, background: 'linear-gradient(90deg, #00FF66 0%, #FFD600 60%, #FF0033 100%)', boxShadow: '0 0 12px rgba(255,0,51,0.3)' }} />
          </div>
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throttleData}>
                <defs>
                  <linearGradient id="gThrottle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} interval={15} />
                <YAxis tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine y={80} stroke="#FF003330" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="throttle" stroke="#a78bfa" strokeWidth={1.5} fill="url(#gThrottle)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-channel overlay */}
        <div className="rounded border border-white/[0.06] bg-[#0B0E14] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Multi-Channel Overlay</span>
            <div className="flex items-center gap-4 text-[8px] font-mono text-white/30">
              {[{ label: 'SPEED', color: colors.vividRed }, { label: 'BATT', color: colors.neonGreen }, { label: 'TEMP', color: colors.signalYellow }, { label: 'EFF', color: '#a78bfa' }].map(c => (
                <span key={c.label} className="flex items-center gap-1">
                  <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: c.color }} />{c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeChartData}>
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} interval={15} />
                <YAxis tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="speed"      stroke={colors.vividRed} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="battery"    stroke={colors.neonGreen} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="temp"       stroke={colors.signalYellow} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="efficiency" stroke="#a78bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}