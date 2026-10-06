import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';

const tip = { contentStyle: { background: '#111', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, borderRadius: 4 }, labelStyle: { color: '#fff' } };

function LiveMetricPanel({ label, value, unit, color, max, data, dataKey }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">{label}</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-[7px] font-mono text-white/15">LIVE</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-display font-black" style={{ color, textShadow: `0 0 12px ${color}50` }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
        <span className="text-[9px] font-mono text-white/20">{unit}</span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {data?.length > 0 && (
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`g${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#g${label})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function TelemetryDashboard() {
  const navigate = useNavigate();
  // EXPLICITLY set isDemoMode to false for live hardware mode
  // Change to true for demo mode
  const { telemetry, chartData, formatTime, power, estimatedLapsRemaining, thermalAlert, voltageAlert } = useTelemetry(
    null,  // sessionId (null = listen to all sessions)
    true,  // enabled
    { isDemoMode: false }  // EXPLICIT: Set to false for live hardware, true for demo
  );

  const throttleData = chartData.map(d => ({ ...d, throttle: d.efficiency }));

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">TELEMETRY DASHBOARD</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono">
          <div className="flex items-center gap-1.5 text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE · 20Hz
          </div>
          <span className="text-white/20">{formatTime(telemetry.raceTime)}</span>
          {/* Thermal Alert Badge */}
          <div className={`px-2 py-0.5 rounded text-[7px] font-bold ${thermalAlert.flashing ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${thermalAlert.color}20`, color: thermalAlert.color, border: `1px solid ${thermalAlert.color}40` }}>
            TEMP: {thermalAlert.level.toUpperCase()}
          </div>
          {/* Voltage Alert Badge */}
          <div className={`px-2 py-0.5 rounded text-[7px] font-bold ${voltageAlert.flashing ? 'animate-pulse' : ''}`} style={{ backgroundColor: `${voltageAlert.color}20`, color: voltageAlert.color, border: `1px solid ${voltageAlert.color}40` }}>
            VOLT: {voltageAlert.level.toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Primary metrics */}
        <div className="grid grid-cols-3 gap-3">
          <LiveMetricPanel label="Speed"      value={telemetry.speed}      unit="mph" color="#ef4444" max={40}  data={chartData} dataKey="speed" />
          <LiveMetricPanel label="Battery"    value={telemetry.battery}    unit="%"   color="#22c55e" max={100} data={chartData} dataKey="battery" />
          <LiveMetricPanel label="Temp"       value={telemetry.temp}       unit="°C"  color="#eab308" max={80}  data={chartData} dataKey="temp" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <LiveMetricPanel label="Efficiency" value={telemetry.efficiency} unit="%"   color="#a78bfa" max={100} data={chartData} dataKey="efficiency" />
          <LiveMetricPanel label="Voltage"    value={telemetry.voltage}    unit="V"   color="#60a5fa" max={50}  data={chartData} dataKey="voltage" />
          <LiveMetricPanel label="Current"    value={telemetry.current}    unit="A"   color="#22d3ee" max={20}  />
        </div>
        {/* Power and Laps Remaining */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Power Output</span>
              <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black text-blue-400">{power.toFixed(0)}</span>
              <span className="text-[9px] font-mono text-white/20">Watts</span>
            </div>
            <div className="text-[7px] font-mono text-white/15 mt-1">V × I = {telemetry.voltage.toFixed(1)}V × {telemetry.current.toFixed(1)}A</div>
          </div>
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Est. Laps Remaining</span>
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black text-green-400">{estimatedLapsRemaining}</span>
              <span className="text-[9px] font-mono text-white/20">laps</span>
            </div>
            <div className="text-[7px] font-mono text-white/15 mt-1">At current discharge rate</div>
          </div>
        </div>

        {/* Throttle position */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Throttle Position — Live</span>
            <span className="text-xl font-display font-black text-primary">{telemetry.efficiency.toFixed(0)}%</span>
          </div>
          <div className="h-8 bg-white/[0.03] rounded-lg overflow-hidden mb-2">
            <div className="h-full rounded-lg transition-all duration-300"
              style={{ width: `${telemetry.efficiency}%`, background: 'linear-gradient(90deg, #22c55e 0%, #eab308 60%, #ef4444 100%)', boxShadow: '0 0 12px rgba(239,68,68,0.3)' }} />
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
                <ReferenceLine y={80} stroke="#ef444430" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="throttle" stroke="#a78bfa" strokeWidth={1.5} fill="url(#gThrottle)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-channel overlay */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Multi-Channel Overlay</span>
            <div className="flex items-center gap-4 text-[8px] font-mono text-white/30">
              {[{ label: 'SPEED', color: '#ef4444' }, { label: 'BATT', color: '#22c55e' }, { label: 'TEMP', color: '#eab308' }, { label: 'EFF', color: '#a78bfa' }].map(c => (
                <span key={c.label} className="flex items-center gap-1">
                  <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: c.color }} />{c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} interval={15} />
                <YAxis tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="speed"      stroke="#ef4444" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="battery"    stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="temp"       stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="efficiency" stroke="#a78bfa" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}