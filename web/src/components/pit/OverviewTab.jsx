import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { Zap, TrendingUp, TrendingDown, Cpu, Gauge, Activity, BatteryCharging } from 'lucide-react';

const COLOR = {
  red:    '#ef4444',
  green:  '#22c55e',
  yellow: '#eab308',
  blue:   '#60a5fa',
  purple: '#a78bfa',
  cyan:   '#22d3ee',
};

function MetricCard({ label, value, unit, color, data, dataKey, trend, subValue }) {
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
        {subValue && (
          <span className="ml-auto text-[8px] font-mono text-white/30">{subValue}</span>
        )}
      </div>
      {data?.length > 0 && dataKey && (
        <div className="h-7">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`g${label.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hex} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={hex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={dataKey} stroke={hex} strokeWidth={1.5}
                fill={`url(#g${label.replace(/[^a-zA-Z]/g, '')})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function HealthBar({ label, pct, color, valueStr }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-mono text-white/35">{label}</span>
        <span className="text-[9px] font-mono font-bold" style={{ color }}>{valueStr || `${pct.toFixed(0)}%`}</span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
    </div>
  );
}

export default function OverviewTab({ telemetry, chartData, oracleMessages }) {
  const [chartMode, setChartMode] = useState('speed'); // 'speed' | 'voltage' | 'current' | 'power' | 'multi'
  const latestOracle = oracleMessages?.[0];

  const drainRate = chartData.length > 5
    ? ((chartData[chartData.length - 6]?.battery ?? telemetry.battery) - telemetry.battery).toFixed(2)
    : '0.00';
  const tempRate = chartData.length > 5
    ? (telemetry.temp - (chartData[chartData.length - 6]?.temp ?? telemetry.temp)).toFixed(2)
    : '0.00';

  const battHealth = telemetry.battery;
  const thermalRisk = Math.min(100, (telemetry.temp / 75) * 100);
  const voltageHealth = Math.min(100, Math.max(0, ((telemetry.voltage - 42) / (54.6 - 42)) * 100));
  const livePower = telemetry.power != null ? telemetry.power : (telemetry.current * telemetry.voltage);

  return (
    <div className="flex flex-col gap-3">

      {/* Telemetry grid: 48V Battery Voltage, Total Power, Speeds, Current */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="SPEED (MPH)"
          value={telemetry.speed}
          unit="mph"
          color="red"
          data={chartData}
          dataKey="speed"
          trend={0}
          subValue={`H:${telemetry.speed_hall?.toFixed(1) || '0.0'} G:${telemetry.speed_gps?.toFixed(1) || '0.0'}`}
        />
        <MetricCard
          label="48V TRACTIVE VOLTS"
          value={telemetry.voltage}
          unit="V"
          color="blue"
          data={chartData}
          dataKey="voltage"
          trend={-1}
          subValue={telemetry.voltage > 42 ? 'PACK NOMINAL' : 'LOW BATT'}
        />
        <MetricCard
          label="TOTAL POWER"
          value={livePower}
          unit="W"
          color="purple"
          data={chartData}
          dataKey="power"
          trend={0}
          subValue={livePower > 1000 ? `${(livePower / 1000).toFixed(2)} kW` : ''}
        />
        <MetricCard
          label="MOTOR CURRENT"
          value={telemetry.current}
          unit="A"
          color="cyan"
          data={chartData}
          dataKey="current"
          trend={0}
        />
        <MetricCard
          label="BATTERY STATE"
          value={telemetry.battery}
          unit="%"
          color="green"
          data={chartData}
          dataKey="battery"
          trend={-1}
        />
        <MetricCard
          label="DRIVE EFFICIENCY"
          value={telemetry.efficiency}
          unit="%"
          color="yellow"
          data={chartData}
          dataKey="efficiency"
          trend={0}
        />
      </div>

      {/* Dynamic Telemetry Time-Series Chart with Channel Switcher */}
      <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-mono tracking-widest text-white/50 uppercase font-bold">
              Telemetry Stream — {chartMode.toUpperCase()} OVER TIME
            </span>
          </div>

          {/* Interactive Chart Channel Selector */}
          <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded border border-white/5">
            {[
              { id: 'speed',   label: 'SPEED',   color: '#ef4444' },
              { id: 'voltage', label: 'VOLTS',   color: '#60a5fa' },
              { id: 'current', label: 'AMPS',    color: '#22d3ee' },
              { id: 'power',   label: 'WATTS',   color: '#a78bfa' },
              { id: 'multi',   label: 'MULTI',   color: '#22c55e' },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setChartMode(btn.id)}
                className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider transition-all ${
                  chartMode === btn.id
                    ? 'bg-white/10 text-white font-bold border border-white/15 shadow-sm'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                style={chartMode === btn.id ? { color: btn.color } : {}}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Chart Display */}
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'speed' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gSpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={1.5} fill="url(#gSpd)" dot={false} isAnimationActive={false} name="Speed (mph)" />
              </AreaChart>
            ) : chartMode === 'voltage' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gVolt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="voltage" stroke="#60a5fa" strokeWidth={1.5} fill="url(#gVolt)" dot={false} isAnimationActive={false} name="Voltage (V)" />
              </AreaChart>
            ) : chartMode === 'current' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gCurr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={1.5} fill="url(#gCurr)" dot={false} isAnimationActive={false} name="Current (A)" />
              </AreaChart>
            ) : chartMode === 'power' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gPwr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="power" stroke="#a78bfa" strokeWidth={1.5} fill="url(#gPwr)" dot={false} isAnimationActive={false} name="Power (W)" />
              </AreaChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gSpdMulti" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVoltMulti" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={1.5} fill="url(#gSpdMulti)" dot={false} isAnimationActive={false} name="Speed (mph)" />
                <Area type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={1.5} fill="none" dot={false} isAnimationActive={false} name="Current (A)" />
              </AreaChart>
            )}
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
              <div className="text-[7px] font-mono text-white/20 mb-1 tracking-wider">POWER DRAW</div>
              <div className="text-lg font-display font-black text-blue-400">{livePower.toFixed(0)}<span className="text-xs font-mono text-white/20">W</span></div>
            </div>
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {oracleMessages?.slice(0, 4).map(msg => (
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
          <HealthBar label="48V Battery Pack" pct={battHealth}      color="#22c55e" valueStr={`${telemetry.battery.toFixed(1)}% (${telemetry.voltage.toFixed(1)}V)`} />
          <HealthBar label="Pack Voltage"     pct={voltageHealth}   color="#60a5fa" valueStr={`${telemetry.voltage.toFixed(1)}V`} />
          <HealthBar label="Thermal Load"     pct={100 - thermalRisk} color="#eab308" valueStr={`${telemetry.temp.toFixed(1)}°C`} />
          <HealthBar label="Drive Efficiency" pct={telemetry.efficiency} color="#a78bfa" valueStr={`${telemetry.efficiency.toFixed(0)}%`} />
          <div className="mt-3 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[9px] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-400">
                {telemetry.voltage > 42.0 ? '48V Tractive System Nominal' : (telemetry.voltage > 0 ? 'Low Battery Warning' : 'Awaiting 48V Tractive Telemetry')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}