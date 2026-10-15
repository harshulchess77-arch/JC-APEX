import React from 'react';

export function MetricChip({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 border-r border-white/5 last:border-r-0">
      <span className="text-xs font-display font-bold" style={{ color, textShadow: `0 0 10px ${color}60` }}>{value}</span>
      <span className="text-[8px] font-mono text-white/20 tracking-wider mt-0.5">{label}</span>
    </div>
  );
}
