import React from 'react';
import { motion } from 'framer-motion';
import BigArc from './BigArc';

/**
 * SpeedometerPanel - Center speedometer gauge for Driver HUD
 * @param {Object} props
 * @param {boolean} props.focusMode - Whether focus mode is active
 * @param {number} props.safeSpeed - Current speed
 * @param {string} props.speedColor - Color for speed display
 * @param {Object} props.targetPace - Target pace object
 * @param {number} props.safeEfficiency - Efficiency percentage
 * @param {number} props.safeBattery - Battery percentage
 * @param {string} props.battColor - Battery color
 * @param {number} props.safeVoltage - Voltage
 * @param {number} props.safeCurrent - Current
 * @param {number} props.safePower - Power
 * @param {number} props.safeSpeedHall - Hall sensor speed
 * @param {number} props.safeSpeedGps - GPS speed
 * @param {Object} props.latestOracle - Latest Oracle message
 * @param {Function} props.formatTime - Time formatter
 * @param {number} props.safeRaceTime - Race time
 */
export default function SpeedometerPanel({
  focusMode,
  safeSpeed,
  speedColor,
  targetPace,
  safeEfficiency,
  safeBattery,
  battColor,
  safeVoltage,
  safeCurrent,
  safePower,
  safeSpeedHall,
  safeSpeedGps,
  latestOracle,
  formatTime,
  safeRaceTime,
}) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center relative bg-[#08090C] ${focusMode ? 'p-8' : 'p-4 md:p-6'}`}>
      {/* Target Pace Lightbar */}
      <div className={`w-full max-w-md mb-4 ${focusMode ? 'mb-8' : ''}`}>
        <div className="flex items-center justify-between text-[8px] font-mono text-white/30 mb-1">
          <span>TARGET PACE</span>
          <span style={{ color: targetPace.color }}>{targetPace.label}</span>
        </div>
        <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden flex relative">
          <div className="h-full transition-all" style={{ width: '33%', backgroundColor: '#10B981' }} />
          <div className="h-full transition-all" style={{ width: '33%', backgroundColor: '#FFB300' }} />
          <div className="h-full transition-all" style={{ width: '34%', backgroundColor: '#FF1E42' }} />
          {/* Pace indicator */}
          <div 
            className="absolute h-4 top-1/2 -translate-y-1/2 w-1 bg-white shadow-lg transition-all rounded-full"
            style={{ 
              left: `${targetPace.zone === 'blue' || targetPace.zone === 'green' ? '20%' : targetPace.zone === 'yellow' ? '50%' : '80%'}`,
              transform: 'translateX(-50%) translateY(-50%)'
            }} 
          />
        </div>
      </div>
      {/* Big arc dial */}
      <div className={`relative flex items-center justify-center ${focusMode ? 'scale-125' : ''}`} style={{ width: 300, height: 260 }}>
        <BigArc value={safeSpeed} max={40} color={speedColor} />
        <div className="relative z-10 text-center mt-6">
          <div className="font-display font-black leading-none" style={{
            fontSize: focusMode ? 120 : 80, color: speedColor,
            textShadow: speedColor === '#FF1E42' ? '0 0 30px #FF1E4260' : '0 0 30px rgba(16,185,129,0.2)'
          }}>
            {safeSpeed.toFixed(1)}
          </div>
          <div className={`font-mono text-white/30 tracking-[0.5em] mt-1 ${focusMode ? 'text-lg' : 'text-[10px]'}`}>MPH</div>
        </div>
      </div>

      {/* Throttle bar */}
      <div className="w-56 mt-2 mb-5">
        <div className="flex items-center justify-between text-[7px] font-mono text-white/30 mb-1">
          <span>THROTTLE INPUT</span>
          <span style={{ color: speedColor }}>{safeEfficiency.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${safeEfficiency}%`, background: 'linear-gradient(90deg, #10B981 0%, #FFB300 60%, #FF1E42 100%)' }} />
        </div>
      </div>

      {/* Sub metrics - simplified in focus mode */}
      {!focusMode ? (
        <div className="flex items-center gap-5 flex-wrap justify-center max-w-xl">
          {[
            { label: 'BATT',  value: `${safeBattery.toFixed(0)}%`, sub: safeBattery > 40 ? 'GOOD' : 'LOW', color: battColor },
            { label: '48V SYSTEM', value: `${safeVoltage.toFixed(1)}V`, sub: safeVoltage > 44 ? '48V NOMINAL' : '48V SAG', color: '#FF1E42' },
            { label: 'AMPS',  value: `${safeCurrent.toFixed(1)}A`, sub: 'CURRENT', color: '#FF1E42' },
            { label: 'MOTOR POWER', value: `${safePower.toFixed(0)}W`, sub: 'WATTS', color: '#FF1E42' },
            { label: 'HALL SPEED', value: `${safeSpeedHall.toFixed(1)}`, sub: 'MPH', color: '#FF1E42' },
            { label: 'GPS SPEED', value: `${safeSpeedGps.toFixed(1)}`, sub: 'MPH', color: '#FFB300' },
          ].map(m => (
            <div key={m.label} className="text-center px-1.5">
              <div className="text-[7px] font-mono text-white/30 tracking-wider mb-0.5">{m.label}</div>
              <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
              {m.sub && <div className="text-[7px] font-mono text-white/25 mt-0.5">{m.sub}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-8 mt-8 flex-wrap justify-center">
          <div className="text-center">
            <div className="text-[8px] font-mono text-white/30 mb-1">BATTERY</div>
            <div className="text-4xl font-display font-black" style={{ color: battColor }}>{safeBattery.toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-mono text-white/30 mb-1">VOLTAGE</div>
            <div className="text-4xl font-display font-black text-[#FF1E42]">{safeVoltage.toFixed(1)}V</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-mono text-white/30 mb-1">CURRENT</div>
            <div className="text-4xl font-display font-black text-[#FF1E42]">{safeCurrent.toFixed(1)}A</div>
          </div>
        </div>
      )}

      {/* Oracle flash message */}
      {latestOracle && (
        <motion.div key={latestOracle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-5 px-4 py-2 rounded border text-[9px] font-mono max-w-xs text-center ${
            latestOracle.severity === 'critical' ? 'border-[#FF1E42]/40 bg-[#FF1E42]/10 text-[#FF1E42]' :
            latestOracle.severity === 'warning'  ? 'border-[#FFB300]/40 bg-[#FFB300]/10 text-[#FFB300]' :
                                                    'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
          }`}>
          <span className="opacity-40 mr-1">ORACLE</span>{latestOracle.text}
        </motion.div>
      )}

      {/* Status footer */}
      <div className="absolute bottom-3 text-[7px] font-mono text-white/20 tracking-widest flex items-center gap-3">
        <span>● TELEMETRY LIVE · 20Hz</span>
        <span>·</span>
        <span>ORACLE v2</span>
        <span>·</span>
        <span>{formatTime ? formatTime(safeRaceTime) : '00:00'}</span>
      </div>
    </div>
  );
}
