import React from 'react';

export function BatteryBar({ battery, blocks = 10 }) {
  const filled = Math.round((battery / 100) * blocks);
  const getColor = (i) => {
    if (i >= 8) return '#22c55e';
    if (i >= 5) return '#eab308';
    return '#ef4444';
  };
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-sm transition-all"
          style={{ backgroundColor: i < filled ? getColor(i) : 'rgba(255,255,255,0.05)' }} />
      ))}
    </div>
  );
}
