import React from 'react';
import { Radio } from 'lucide-react';
import { COMMANDS } from './FlagConfig';

/**
 * DriverLeftPanel - Left sidebar panel for Driver HUD
 * @param {Object} props
 * @param {Array} props.pitMessages - Messages from pit
 * @param {number} props.safeLap - Current lap number
 */
export default function DriverLeftPanel({ pitMessages, safeLap }) {
  return (
    <div className="w-full md:w-44 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] bg-[#101217] flex flex-col overflow-y-auto p-3 gap-3">
      {/* Driver Commands */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Radio className="w-2.5 h-2.5 text-white/20" />
          <span className="text-[7px] font-mono tracking-widest text-white/30 uppercase">Driver Commands</span>
        </div>
        <div className="space-y-1">
          {COMMANDS.map(cmd => (
            <button key={cmd.label}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded border text-[10px] font-display font-bold tracking-wider transition-all hover:opacity-90 active:scale-95"
              style={{ borderColor: cmd.border, background: `${cmd.color}08`, color: cmd.color }}>
              {cmd.label}
              <span className="opacity-30">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ghost-Link Feed */}
      <div className="border-t border-white/[0.06] pt-3">
        <div className="text-[7px] font-mono text-white/25 tracking-widest mb-1">((●)) GHOST-LINK™ FEED</div>
        <div className="text-[7px] font-mono text-primary/70 mb-2 tracking-widest">((●)) PRIORITY ALERTS</div>
        {pitMessages.length === 0 ? (
          <p className="text-[8px] font-mono text-white/20 text-center py-3">No active alerts</p>
        ) : pitMessages.slice(-3).map((m, i) => (
          <div key={i} className="text-[8px] font-mono text-white/60 border border-white/[0.06] bg-[#08090C] rounded px-2 py-1 mb-1">{m.text}</div>
        ))}
      </div>

      {/* Predictive Lap Engine */}
      <div className="border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[7px] font-mono text-white/25 tracking-widest">⚡ PREDICTIVE LAP</span>
          <span className="text-[7px] font-mono px-1 rounded border border-[#FFB300]/30 text-[#FFB300] bg-[#FFB300]/10">ON PACE</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <div>
            <div className="text-[6px] font-mono text-white/25 mb-1">PROJ LAP</div>
            <div className="text-base font-display font-black text-[#FFB300]">—</div>
          </div>
          <div>
            <div className="text-[6px] font-mono text-white/25 mb-1">Δ VS PB</div>
            <div className="text-base font-display font-black text-white">—</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[7px] font-mono text-white/25">
            <span>SEGMENT 1</span>
            <span className="text-[#FFB300]">OPTIMAL</span>
          </div>
          <div className="flex items-center justify-between text-[7px] font-mono text-white/25">
            <span>SEGMENT 2</span>
            <span className="text-[#FFB300]">OPTIMAL</span>
          </div>
          <div className="flex items-center justify-between text-[7px] font-mono text-white/25">
            <span>SEGMENT 3</span>
            <span className="text-[#FFB300]">OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Lap Timing */}
      <div className="border-t border-white/[0.06] pt-3 space-y-1">
        <div className="text-[7px] font-display font-bold tracking-widest text-white/30 uppercase mb-2">Lap Timing</div>
        {[
          { label: 'LAPS', value: Math.floor(safeLap), color: '#FF1E42' },
          { label: 'DIST', value: `${(safeLap * 0.25).toFixed(2)} mi`, color: '#FFB300' },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between text-[8px] font-mono">
            <span className="text-white/30">{s.label}</span>
            <span style={{ color: s.color }} className="font-bold">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
