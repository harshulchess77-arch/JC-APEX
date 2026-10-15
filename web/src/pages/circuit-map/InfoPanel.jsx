import React from 'react';
import { SECTORS, PIT_INFO, SEGMENTS } from './circuit-constants';

export default function InfoPanel({ activeSegment, setActiveSegment }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Sector times */}
      <div className="rounded border border-white/[0.06] bg-[#101217] glass p-3">
        <div className="text-[11px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Sector Times (SAMPLE DATA)</div>
        {SECTORS.map(s => (
          <div key={s.id} className="flex items-center gap-3 mb-2 p-2 rounded bg-white/[0.02]">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1">
              <div className="text-[11px] font-display font-bold text-white/60">{s.name}</div>
              <div className="text-[9px] font-mono text-white/20">{s.type}{s.drs ? ' · DRS' : ''}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-display font-black" style={{ color: s.color }}>{s.time}</div>
              <div className={`text-[10px] font-mono ${s.delta.startsWith('-') ? 'text-green-400' : 'text-primary'}`}>{s.delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pit info */}
      <div className="rounded border border-white/[0.06] bg-[#101217] glass p-3">
        <div className="text-[11px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Pit Entry Info (SAMPLE DATA)</div>
        {PIT_INFO.map(p => (
          <div key={p.label} className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-white/25">{p.label}</span>
            <span className="text-[11px] font-display font-bold text-[#FFB300]">{p.value}</span>
          </div>
        ))}
      </div>

      {/* Track segments */}
      <div className="rounded border border-white/[0.06] bg-[#101217] glass p-3 flex-1">
        <div className="text-[11px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Track Segments (SAMPLE DATA)</div>
        <div className="space-y-1.5">
          {SEGMENTS.map((seg, i) => (
            <button key={seg.name} onClick={() => setActiveSegment(i)}
              className={`w-full text-left p-2 rounded border transition-all ${activeSegment === i ? 'border-primary/25 bg-primary/5' : 'border-transparent hover:border-white/[0.04]'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-display font-bold ${activeSegment === i ? 'text-primary' : 'text-white/50'}`}>{seg.name}</span>
                <span className="text-[9px] font-mono text-white/20">{seg.type}</span>
              </div>
              {activeSegment === i && <p className="text-[10px] font-mono text-white/30 mt-1">{seg.note}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
