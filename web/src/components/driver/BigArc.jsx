import React from 'react';

/**
 * BigArc - Circular gauge component for displaying metrics
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {number} props.max - Maximum value
 * @param {string} props.color - Color for the gauge
 */
export default function BigArc({ value, max, color }) {
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
