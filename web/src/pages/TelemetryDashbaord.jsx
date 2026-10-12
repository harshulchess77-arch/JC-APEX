import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Zap, Battery, Gauge, Radio, Signal, Power } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';
import ErrorBoundary from '../ErrorBoundary';

const tip = { contentStyle: { background: '#08090C', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, borderRadius: 4 }, labelStyle: { color: '#fff' } };

function LiveMetricPanel({ label, value, unit, color, max, data, dataKey }) {
  // Defensive fallbacks for rapid 5 Hz telemetry updates
  const safeValue = value ?? 0;
  const safeMax = max ?? 100;
  const safeData = data ?? [];
  const safeDataKey = dataKey ?? 'value';
  const pct = Math.min((safeValue / safeMax) * 100, 100);
  return (
    <div className="rounded border border-white/[0.06] bg-[#08090C] p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">{label}</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-[7px] font-mono text-white/15">LIVE</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-display font-black tabular-nums" style={{ color, textShadow: `0 0 12px ${color}50` }}>{typeof safeValue === 'number' ? safeValue.toFixed(1) : safeValue}</span>
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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/[0.08] bg-[#08090C]/50">
      {Icon && <Icon className="w-3 h-3" style={{ color }} />}
      <span className="text-[7px] font-mono text-white/40 uppercase">{label}</span>
      <span className="text-[8px] font-mono font-bold" style={{ color }}>{typeof safeValue === 'number' ? safeValue.toFixed(1) : safeValue}</span>
      <span className="text-[7px] font-mono text-white/30">{unit}</span>
    </div>
  );
}

export default function TelemetryDashboard() {
  const navigate = useNavigate();
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Toggle between demo and live hardware mode
  const { telemetry, chartData, formatTime, power, estimatedLapsRemaining, thermalAlert, voltageAlert, hardwareData, isLive, isDemoMode: actualDemoMode } = useTelemetry(
    null,  // sessionId (null = listen to all sessions)
    true,  // enabled
    { isDemoMode }  // Controlled by toggle
  );

  // Defensive fallbacks for telemetry data
  const safeTelemetry = telemetry ?? {};
  const safeHardwareData = hardwareData ?? {};
  const safeChartData = chartData ?? [];
  const safePower = power ?? 0;
  const safeEstimatedLaps = estimatedLapsRemaining ?? 0;

  const throttleData = safeChartData.map(d => ({ ...d, throttle: d.efficiency ?? 0 }));

  // JC-APEX Crimson Red F1 Color Palette
  const colors = {
    crimsonRed: '#FF1E42',
    nominalGreen: '#10B981',
    signalYellow: '#FFB300',
    dataCyan: '#00E5FF',
    carbonDark: '#08090C',
  };

  // Determine connection status
  const connectionStatus = actualDemoMode ? 'DEMO' : (isLive ? 'LIVE' : 'DISCONNECTED');
  const statusColor = actualDemoMode ? colors.signalYellow : (isLive ? colors.nominalGreen : colors.crimsonRed);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#08090C] flex flex-col">
        <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#08090C] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Activity className="w-4 h-4" style={{ color: colors.crimsonRed }} />
          <span className="font-display font-black text-sm tracking-widest text-white">TELEMETRY DASHBOARD</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono">
          {/* Connection Status Badge */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border`} style={{ backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30`, color: statusColor }}>
            <Power className="w-2.5 h-2.5" />
            <span className="font-bold">{connectionStatus}</span>
            {!actualDemoMode && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: isLive ? colors.nominalGreen : colors.crimsonRed }} />}
          </div>
          <span className="text-white/20">{formatTime(safeTelemetry.raceTime ?? 0)}</span>
          {/* Demo Mode Toggle */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`px-2 py-0.5 rounded border text-[7px] font-bold transition-colors ${isDemoMode ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
          >
            {isDemoMode ? 'DEMO ON' : 'DEMO OFF'}
          </button>
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
          <StatusBadge label="Power" value={safePower / 1000} unit="kW" color={colors.nominalGreen} icon={Zap} />
          <StatusBadge label="Voltage" value={safeTelemetry.voltage} unit="V" color={colors.nominalGreen} icon={Battery} />
          <StatusBadge label="Current" value={safeTelemetry.current} unit="A" color={colors.nominalGreen} icon={Gauge} />
          <StatusBadge label="Hall Spd" value={safeTelemetry.speed_hall} unit="mph" color={colors.signalYellow} icon={Radio} />
          <StatusBadge label="GPS Spd" value={safeTelemetry.speed_gps} unit="mph" color={colors.signalYellow} icon={Radio} />
          <StatusBadge label="RSSI" value={safeHardwareData.rssi} unit="dBm" color={safeHardwareData.rssi < -70 ? colors.crimsonRed : colors.nominalGreen} icon={Signal} />
          <StatusBadge label="SNR" value={safeHardwareData.snr} unit="dB" color={safeHardwareData.snr < 5 ? colors.crimsonRed : colors.nominalGreen} icon={Signal} />
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-3 gap-3">
          <LiveMetricPanel label="Speed"      value={safeTelemetry.speed}      unit="mph" color={colors.crimsonRed} max={40}  data={safeChartData} dataKey="speed" />
          <LiveMetricPanel label="Battery"    value={safeTelemetry.battery}    unit="%"   color={colors.nominalGreen} max={100} data={safeChartData} dataKey="battery" />
          <LiveMetricPanel label="Temp"       value={safeTelemetry.temp}       unit="°C"  color={colors.signalYellow} max={80}  data={safeChartData} dataKey="temp" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <LiveMetricPanel label="Efficiency" value={safeTelemetry.efficiency} unit="%"   color={colors.nominalGreen} max={100} data={safeChartData} dataKey="efficiency" />
          <LiveMetricPanel label="Voltage"    value={safeTelemetry.voltage}    unit="V"   color={colors.crimsonRed} max={50}  data={safeChartData} dataKey="voltage" />
          <LiveMetricPanel label="Current"    value={safeTelemetry.current}    unit="A"   color={colors.signalYellow} max={20}  />
        </div>
        {/* Power and Completed Laps */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Power Output</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: colors.crimsonRed }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black" style={{ color: colors.crimsonRed }}>{safePower.toFixed(0)}</span>
              <span className="text-[9px] font-mono text-white/30">Watts</span>
            </div>
            <div className="text-[7px] font-mono text-white/20 mt-1">V × I = {(safeTelemetry.voltage ?? 0).toFixed(1)}V × {(safeTelemetry.current ?? 0).toFixed(1)}A</div>
          </div>
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Completed Laps</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: colors.nominalGreen }} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black text-[#FF1E42]">{Math.floor(safeTelemetry.lap || 0)}</span>
              <span className="text-[9px] font-mono text-white/30">laps</span>
            </div>
            <div className="text-[7px] font-mono text-white/20 mt-1">Electrathon 62-Min Session Rule</div>
          </div>
        </div>

        {/* Throttle position */}
        <div className="rounded border border-white/[0.06] bg-[#08090C] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Throttle Position — Live</span>
            <span className="text-xl font-display font-black" style={{ color: colors.nominalGreen }}>{(safeTelemetry.efficiency ?? 0).toFixed(0)}%</span>
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
        <div className="rounded border border-white/[0.06] bg-[#08090C] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Multi-Channel Overlay</span>
            <div className="flex items-center gap-4 text-[8px] font-mono text-white/30">
              {[{ label: 'SPEED', color: colors.crimsonRed }, { label: 'BATT', color: colors.nominalGreen }, { label: 'TEMP', color: colors.signalYellow }, { label: 'EFF', color: '#a78bfa' }].map(c => (
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
                <Line type="monotone" dataKey="speed"      stroke={colors.crimsonRed} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="battery"    stroke={colors.nominalGreen} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="temp"       stroke={colors.signalYellow} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="efficiency" stroke="#a78bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}