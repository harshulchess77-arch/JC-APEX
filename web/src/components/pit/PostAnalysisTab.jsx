import React from 'react';
import { Download, BarChart3, FileText } from 'lucide-react';

export default function PostAnalysisTab({ telemetry, chartData }) {
  const laps = Math.floor(telemetry.lap);
  const peakSpeed = chartData.length ? Math.max(...chartData.map(d => d.speed || 0)).toFixed(1) : '—';
  const avgEff = chartData.length
    ? (chartData.reduce((s, d) => s + (d.efficiency || 0), 0) / chartData.length).toFixed(1)
    : '—';
  const dist = (laps * 0.25).toFixed(2);

  const HEALTH = [
    { label: 'Battery System',   value: `${telemetry.battery.toFixed(1)}%`,    pct: telemetry.battery,               color: '#22c55e' },
    { label: 'Thermal Load',     value: `${telemetry.temp.toFixed(1)}°C`,      pct: (telemetry.temp / 80) * 100,     color: '#eab308' },
    { label: 'Drive Efficiency', value: `${telemetry.efficiency.toFixed(1)}%`, pct: telemetry.efficiency,            color: '#a78bfa' },
    { label: 'Voltage Stability',value: `${telemetry.voltage.toFixed(1)}V`,    pct: (telemetry.voltage / 50) * 100, color: '#60a5fa' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Left */}
      <div className="flex flex-col gap-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'LAPS',       value: laps,          color: '#ef4444' },
            { label: 'PEAK SPEED', value: `${peakSpeed} mph`, color: '#ef4444' },
            { label: 'LAST BATT',  value: `${telemetry.battery.toFixed(1)}%`, color: '#22c55e' },
            { label: 'AVG EFF',    value: `${avgEff}%`,  color: '#a78bfa' },
            { label: 'DISTANCE',   value: `${dist} mi`,  color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 text-center">
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">{s.label}</div>
              <div className="text-lg font-display font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Lap Breakdown */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Lap-by-Lap Breakdown</span>
          </div>
          {laps === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/15">
              <BarChart3 className="w-6 h-6 mb-2 opacity-20" />
              <p className="text-[9px] font-mono">No laps recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: Math.min(laps, 8) }, (_, i) => {
                const w = 60 + (i % 3) * 10;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[8px] font-mono text-white/25 w-6">L{i + 1}</span>
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${w}%` }} />
                    </div>
                    <span className="text-[8px] font-mono text-white/30 w-12 text-right">{(3 + (i % 4) * 0.5).toFixed(2)}m</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col gap-3">
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase block mb-3">System Health Report</span>
          {HEALTH.map(h => (
            <div key={h.label} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-white/40">{h.label}</span>
                <span className="text-[10px] font-display font-bold" style={{ color: h.color }}>{h.value}</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${h.pct}%`, backgroundColor: h.color, boxShadow: `0 0 6px ${h.color}50` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-display font-bold tracking-widest text-yellow-500/70 uppercase">Oracle Assessment</span>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-green-500/25 text-green-400">● LIVE</span>
          </div>
          <p className="text-[9px] font-mono text-white/30">Analyzing telemetry data...</p>
        </div>

        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Export Report</span>
            </div>
            <span className="text-[7px] font-mono text-white/15">RAW · CSV · JSON</span>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded border border-primary/35 bg-primary/8 text-primary font-display font-black text-xs tracking-widest hover:bg-primary/15 transition-colors">
            <FileText className="w-3.5 h-3.5" />
            EXPORT LUXURY PDF REPORT
          </button>
        </div>
      </div>
    </div>
  );
}