import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, TrendingUp, TrendingDown, Cpu } from 'lucide-react';

const COLOR = {
  red:    '#ef4444',
  green:  '#22c55e',
  yellow: '#eab308',
  blue:   '#60a5fa',
  purple: '#a78bfa',
  cyan:   '#22d3ee',
};

function MetricCard({ label, value, unit, color, data, dataKey, trend }) {
  const hex = COLOR[color] || '#ef4444';
  return (
    <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-mono tracking-widest text-white/25 uppercase">{label}</span>
        {trend != null && (
          trend >= 0
            ? <TrendingUp className="w-2.5 h-2.5 text-green-500/40" />
            : <TrendingDown className="w-2.5 h-2.5 text-primary/40" />
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-[1.6rem] font-display font-black leading-none" style={{ color: hex, textShadow: `0 0 16px ${hex}40` }}>
          {typeof value === 'number' ? (value >= 10 ? value.toFixed(1) : value.toFixed(2)) : value}
        </span>
        <span className="text-[9px] font-mono text-white/20">{unit}</span>
      </div>
      {data?.length > 0 && (
        <div className="h-7">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`g${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hex} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={dataKey} stroke={hex} strokeWidth={1.5}
                fill={`url(#g${label})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function HealthBar({ label, pct, color }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-mono text-white/35">{label}</span>
        <span className="text-[9px] font-mono font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
    </div>
  );
}

export default function OverviewTab({ telemetry, chartData, oracleMessages }) {
  const latestOracle = oracleMessages[0];
  const drainRate = chartData.length > 5
    ? ((chartData[chartData.length - 6]?.battery ?? telemetry.battery) - telemetry.battery).toFixed(2)
    : '0.00';
  const tempRate = chartData.length > 5
    ? (telemetry.temp - (chartData[chartData.length - 6]?.temp ?? telemetry.temp)).toFixed(2)
    : '0.00';

  const battHealth = telemetry.battery;
  const thermalRisk = Math.min(100, (telemetry.temp / 75) * 100);
  const voltageHealth = Math.min(100, ((telemetry.voltage - 36) / 12) * 100);
  const effHealth = telemetry.efficiency;

  return (
    <div className="flex flex-col gap-3">

      {/* Telemetry grid */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="SPEED"      value={telemetry.speed}      unit="mph" color="red"    data={chartData} dataKey="speed"      trend={0}  />
        <MetricCard label="BATTERY"    value={telemetry.battery}    unit="%"   color="green"  data={chartData} dataKey="battery"    trend={-1} />
        <MetricCard label="TEMP"       value={telemetry.temp}       unit="°C"  color="yellow" data={chartData} dataKey="temp"       trend={1}  />
        <MetricCard label="EFFICIENCY" value={telemetry.efficiency} unit="%"   color="purple" data={chartData} dataKey="efficiency" trend={0}  />
        <MetricCard label="VOLTAGE"    value={telemetry.voltage}    unit="V"   color="blue"   data={chartData} dataKey="voltage"    trend={-1} />
        <MetricCard label="CURRENT"    value={telemetry.current}    unit="A"   color="cyan"   />
      </div>

      {/* Speed vs Battery stream */}
      <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] font-mono tracking-widest text-white/25 uppercase">Speed vs Battery — Live Stream</span>
          <div className="flex items-center gap-4 text-[8px] font-mono text-white/30">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-primary" />SPEED</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-green-500" />BATT</span>
          </div>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gSpd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="speed"   stroke="#ef4444" strokeWidth={1.5} fill="url(#gSpd)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="battery" stroke="#22c55e" strokeWidth={1.5} fill="url(#gBat)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Oracle + Health */}
      <div className="grid grid-cols-2 gap-3">

        {/* Oracle Core V2 */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Oracle Core V2</span>
            </div>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-green-500/30 text-green-400">● LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white/[0.02] rounded p-2">
              <div className="text-[7px] font-mono text-white/20 mb-1 tracking-wider">DRAIN RATE</div>
              <div className="text-lg font-display font-black text-primary">{drainRate}%<span className="text-xs font-mono text-white/20">/min</span></div>
            </div>
            <div className="bg-white/[0.02] rounded p-2">
              <div className="text-[7px] font-mono text-white/20 mb-1 tracking-wider">TEMP RATE</div>
              <div className="text-lg font-display font-black text-yellow-400">+{tempRate}°<span className="text-xs font-mono text-white/20">/min</span></div>
            </div>
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {oracleMessages.slice(0, 4).map(msg => (
              <div key={msg.id} className={`text-[9px] font-mono px-2.5 py-1.5 rounded border leading-snug ${
                msg.severity === 'critical' ? 'border-primary/20 bg-primary/5 text-primary' :
                msg.severity === 'warning'  ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' :
                                               'border-green-500/15 bg-green-500/5 text-green-400'
              }`}>
                <span className="opacity-40 mr-1.5 text-[7px]">{msg.time}</span>{msg.text}
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase mb-3">System Health</div>
          <HealthBar label="Battery"    pct={battHealth}      color="#22c55e" />
          <HealthBar label="Thermal"    pct={100 - thermalRisk} color="#eab308" />
          <HealthBar label="Voltage"    pct={voltageHealth}   color="#60a5fa" />
          <HealthBar label="Efficiency" pct={effHealth}       color="#a78bfa" />
          <div className="mt-3 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[9px] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-400">All subsystems nominal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}