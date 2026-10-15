import React from 'react';

/**
 * DriverRightPanel - Right sidebar panel for Driver HUD
 * @param {Object} props
 * @param {number} props.safeVoltage - Voltage
 * @param {number} props.safeCurrent - Current
 * @param {number} props.safeBattery - Battery percentage
 * @param {string} props.battColor - Battery color
 * @param {number} props.safeTemp - Temperature
 * @param {number} props.safeLap - Current lap number
 */
export default function DriverRightPanel({
  safeVoltage,
  safeCurrent,
  safeBattery,
  battColor,
  safeTemp,
  safeLap,
}) {
  return (
    <div className="w-full md:w-52 flex-shrink-0 border-t md:border-t-0 md:border-l border-white/[0.06] bg-[#101217] flex flex-col p-3 gap-3 overflow-y-auto">
      {/* Voltage + Current */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'VOLTAGE', value: `${safeVoltage.toFixed(1)}V`, color: '#FF1E42' },
          { label: 'CURRENT', value: `${safeCurrent.toFixed(1)}A`, color: '#FF1E42' },
        ].map(m => (
          <div key={m.label} className="rounded border border-white/[0.06] bg-[#08090C] p-2.5 text-center">
            <div className="text-[7px] font-mono text-white/25 mb-1">{m.label}</div>
            <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Energy Cell */}
      <div className="rounded border border-white/[0.06] bg-[#08090C] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[7px] font-mono text-white/25 tracking-widest">⚡ ENERGY CELL</span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-display font-black" style={{ color: battColor }}>
            {safeBattery.toFixed(0)}
          </span>
          <span className="text-white/20 font-mono text-sm">%</span>
          <span className="ml-auto text-xs font-display font-bold text-[#FF1E42]">{safeVoltage.toFixed(1)}V</span>
        </div>
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${safeBattery}%`, backgroundColor: battColor }} />
        </div>
        <div className="flex items-center justify-between text-[7px] font-mono text-white/30">
          <span>EST REMAINING —</span>
          <span className="text-[#10B981] font-bold">OPTIMAL</span>
        </div>
      </div>

      {/* Device Predictions */}
      <div className="rounded border border-white/[0.06] bg-[#08090C] p-3">
        <div className="text-[7px] font-display font-bold tracking-widest text-white/30 uppercase mb-2">Device Predictions</div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[#FF1E42] text-xs flex-shrink-0">›</span>
            <span className="text-[8px] font-mono text-white/40 leading-snug">
              Runtime margin: {(Math.max(0, safeBattery - 15) * 0.8).toFixed(1)}m at current discharge.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FFB300] text-xs flex-shrink-0">›</span>
            <span className="text-[8px] font-mono text-white/40 leading-snug">
              Thermal headroom: {Math.max(0, 65 - safeTemp).toFixed(0)}°C to safety limit.
            </span>
          </div>
        </div>
      </div>

      {/* Laps counter */}
      <div className="rounded border border-white/[0.06] bg-[#08090C] p-3 mt-auto">
        <div className="text-center">
          <div className="text-[7px] font-mono text-white/25 mb-1">COMPLETED LAPS</div>
          <div className="text-3xl font-display font-black text-[#FF1E42]">{Math.floor(safeLap)}</div>
        </div>
      </div>
    </div>
  );
}
