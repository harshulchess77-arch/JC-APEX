import React from 'react';

export default function SpeedDial({ speed, maxSpeed = 40, throttle = 0, mode = 'BALANCED' }) {
  const pct = Math.min(speed / maxSpeed, 1);
  const r = 50, cx = 64, cy = 68;

  const describeArc = (startDeg, endDeg) => {
    const toRad = d => ((d - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const startAngle = -135;
  const sweep = 270;
  const endAngle = startAngle + pct * sweep;

  const arcColor = pct > 0.8 ? '#ef4444' : pct > 0.5 ? '#eab308' : '#22c55e';
  const needleAngle = startAngle + pct * sweep;
  const needleRad = ((needleAngle - 90) * Math.PI) / 180;

  const modeColor = mode === 'AGGRESSIVE' ? '#ef4444' : mode === 'CONSERVE' ? '#22c55e' : '#eab308';

  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" viewBox="0 0 128 140">
        {/* Background arc */}
        <path d={describeArc(-135, 135)} fill="none" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round" />
        {/* Progress arc */}
        {pct > 0 && (
          <path d={describeArc(-135, endAngle)} fill="none" stroke={arcColor} strokeWidth="5" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 5px ${arcColor})` }} />
        )}
        {/* Tick marks */}
        {Array.from({ length: 11 }, (_, i) => {
          const a = ((-135 + i * 27 - 90) * Math.PI) / 180;
          const isMajor = i % 5 === 0;
          return (
            <line key={i}
              x1={cx + (r - 7) * Math.cos(a)} y1={cy + (r - 7) * Math.sin(a)}
              x2={cx + (r - 1) * Math.cos(a)} y2={cy + (r - 1) * Math.sin(a)}
              stroke={isMajor ? '#444' : '#222'} strokeWidth={isMajor ? 2 : 1} />
          );
        })}
        {/* Needle */}
        {pct > 0 && (
          <line
            x1={cx} y1={cy}
            x2={cx + (r - 16) * Math.cos(needleRad)}
            y2={cy + (r - 16) * Math.sin(needleRad)}
            stroke={arcColor} strokeWidth="1.5" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${arcColor})` }}
          />
        )}
        <circle cx={cx} cy={cy} r="3.5" fill={arcColor} style={{ filter: `drop-shadow(0 0 4px ${arcColor})` }} />
        {/* Speed value */}
        <text x={cx} y={cy + 14} textAnchor="middle" fill="white" fontSize="22" fontFamily="Orbitron,monospace" fontWeight="900" letterSpacing="-1">
          {speed.toFixed(1)}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill="#555" fontSize="7" fontFamily="JetBrains Mono,monospace" letterSpacing="3">
          MPH
        </text>
      </svg>
      <div className="flex items-center justify-between w-full px-1 -mt-1">
        <div className="text-[8px] font-mono text-white/20">THR<br/><span className="text-white/50">{throttle}%</span></div>
        <div className="text-[8px] font-mono text-right" style={{ color: modeColor }}>
          MODE<br/><span className="font-bold text-[9px]">{mode}</span>
        </div>
      </div>
    </div>
  );
}