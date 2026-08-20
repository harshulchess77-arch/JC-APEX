import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';

const SECTORS = [
  { id: 1, name: 'Sector 1', time: '0:42.1', delta: '+0.3s', color: '#22c55e', type: 'STRAIGHT',   drs: true  },
  { id: 2, name: 'Sector 2', time: '1:05.8', delta: '-0.1s', color: '#eab308', type: 'TECHNICAL',  drs: false },
  { id: 3, name: 'Sector 3', time: '0:58.4', delta: '+0.5s', color: '#ef4444', type: 'INFIELD',    drs: false },
];

const PIT_INFO = [
  { label: 'Pit Entry Speed Limit', value: '30 mph' },
  { label: 'Pit Lane Length',       value: '180 m' },
  { label: 'Pit Stop Avg Time',     value: '~28s' },
  { label: 'Pit Entry Marker',      value: 'Turn 14 exit' },
];

const SEGMENTS = [
  { name: 'Start / Finish',   length: '320m', type: 'STRAIGHT',   note: 'DRS zone active' },
  { name: 'Turn 1-2 Complex', length: '—',    type: 'HAIRPIN',    note: 'Tight entry, trail brake' },
  { name: 'Back Straight',    length: '280m', type: 'STRAIGHT',   note: 'Max speed zone' },
  { name: 'Chicane S3',       length: '—',    type: 'TECHNICAL',  note: 'Energy recovery zone' },
  { name: 'Pit Entry',        length: '—',    type: 'PIT',        note: '30 mph limit' },
  { name: 'Final Corner',     length: '—',    type: 'FAST BEND',  note: 'Full throttle exit' },
];

export default function CircuitMap() {
  const navigate = useNavigate();
  const [activeSegment, setActiveSegment] = useState(0);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Map className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">CIRCUIT MAP</span>
        </div>
        <span className="text-[8px] font-mono text-white/20 tracking-widest">METRO CIRCUIT · 1.24 mi / LAP</span>
      </header>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-3 gap-4">
        {/* Circuit SVG */}
        <div className="col-span-2 rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
          <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Circuit Layout — Metro Circuit</div>
          <div className="relative flex items-center justify-center" style={{ height: 320 }}>
            <svg viewBox="0 0 500 300" className="w-full h-full max-h-80">
              {/* Track outline */}
              <path d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
                fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
              <path d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
                fill="none" stroke="#222" strokeWidth="18" strokeLinejoin="round" />
              {/* DRS zone */}
              <path d="M 150 60 L 350 60" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }} />
              {/* Sector markers */}
              <circle cx="150" cy="60" r="6" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
              <circle cx="440" cy="150" r="6" fill="#eab308" style={{ filter: 'drop-shadow(0 0 4px #eab308)' }} />
              <circle cx="280" cy="240" r="6" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
              {/* Start/Finish */}
              <line x1="100" y1="140" x2="100" y2="160" stroke="white" strokeWidth="3" />
              <text x="105" y="155" fill="white" fontSize="9" fontFamily="Orbitron,monospace">S/F</text>
              {/* Pit lane */}
              <path d="M 370 240 L 280 255 Q 240 255 220 215" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="6 3" />
              <text x="290" y="268" fill="#60a5fa" fontSize="8" fontFamily="JetBrains Mono,monospace">PIT LANE</text>
              {/* DRS label */}
              <text x="230" y="52" fill="#22c55e" fontSize="8" fontFamily="JetBrains Mono,monospace">DRS ZONE</text>
              {/* Sector labels */}
              <text x="130" y="40"  fill="#22c55e" fontSize="9" fontFamily="Orbitron,monospace" fontWeight="700">S1</text>
              <text x="445" y="155" fill="#eab308" fontSize="9" fontFamily="Orbitron,monospace" fontWeight="700">S2</text>
              <text x="260" y="258" fill="#ef4444" fontSize="9" fontFamily="Orbitron,monospace" fontWeight="700">S3</text>
              {/* Direction arrow */}
              <path d="M 200 65 L 210 60 L 200 55" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
            </svg>
          </div>
        </div>

        {/* Right info panel */}
        <div className="flex flex-col gap-3">
          {/* Sector times */}
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Sector Times</div>
            {SECTORS.map(s => (
              <div key={s.id} className="flex items-center gap-3 mb-2 p-2 rounded bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <div className="text-[9px] font-display font-bold text-white/60">{s.name}</div>
                  <div className="text-[7px] font-mono text-white/20">{s.type}{s.drs ? ' · DRS' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-display font-black" style={{ color: s.color }}>{s.time}</div>
                  <div className={`text-[8px] font-mono ${s.delta.startsWith('-') ? 'text-green-400' : 'text-primary'}`}>{s.delta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pit info */}
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Pit Entry Info</div>
            {PIT_INFO.map(p => (
              <div key={p.label} className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-mono text-white/25">{p.label}</span>
                <span className="text-[9px] font-display font-bold text-blue-400">{p.value}</span>
              </div>
            ))}
          </div>

          {/* Track segments */}
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 flex-1">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Track Segments</div>
            <div className="space-y-1.5">
              {SEGMENTS.map((seg, i) => (
                <button key={seg.name} onClick={() => setActiveSegment(i)}
                  className={`w-full text-left p-2 rounded border transition-all ${activeSegment === i ? 'border-primary/25 bg-primary/5' : 'border-transparent hover:border-white/[0.04]'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-display font-bold ${activeSegment === i ? 'text-primary' : 'text-white/50'}`}>{seg.name}</span>
                    <span className="text-[7px] font-mono text-white/20">{seg.type}</span>
                  </div>
                  {activeSegment === i && <p className="text-[8px] font-mono text-white/30 mt-1">{seg.note}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}