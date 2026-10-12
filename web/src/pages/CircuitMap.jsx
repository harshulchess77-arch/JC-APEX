import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Navigation } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';

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
  const { telemetry, isDemoMode, isLive, isConnected, gpsFix, sats } = useTelemetry(null, true);

  // GPS data from telemetry
  const latitude = telemetry?.latitude ?? 0;
  const longitude = telemetry?.longitude ?? 0;
  const hasGpsFix = gpsFix;

  // Determine connection status
  const connectionStatus = isDemoMode ? 'DEMO' : (isLive ? 'LIVE' : (isConnected ? 'RECONNECTING' : 'NO SIGNAL'));
  const statusColor = isDemoMode ? 'text-primary' : (isLive ? 'text-green-500' : (isConnected ? 'text-amber-500' : 'text-red-500'));

  // Demo mode: use fallback position calculation
  const lapProgress = (telemetry?.lap || 0) % 1;
  const [demoPosition, setDemoPosition] = useState({ x: 60, y: 150 });

  // Fallback position calculation for demo mode
  useEffect(() => {
    if (isDemoMode) {
      const interval = setInterval(() => {
        const progress = (telemetry?.lap || 0) % 1;
        const angle = progress * Math.PI * 2;
        let x, y;
        if (angle < Math.PI / 2) {
          x = 60 + (angle / (Math.PI / 2)) * 90;
          y = 150 - (angle / (Math.PI / 2)) * 90;
        } else if (angle < Math.PI) {
          x = 150 + ((angle - Math.PI / 2) / (Math.PI / 2)) * 290;
          y = 60 + ((angle - Math.PI / 2) / (Math.PI / 2)) * 90;
        } else if (angle < Math.PI * 1.5) {
          x = 440 - ((angle - Math.PI) / (Math.PI / 2)) * 160;
          y = 150 + ((angle - Math.PI) / (Math.PI / 2)) * 90;
        } else {
          x = 280 - ((angle - Math.PI * 1.5) / (Math.PI / 2)) * 220;
          y = 240 - ((angle - Math.PI * 1.5) / (Math.PI / 2)) * 90;
        }
        setDemoPosition({ x, y });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isDemoMode, telemetry?.lap]);

  // Live mode: GPS to SVG coordinate mapping
  const [livePosition, setLivePosition] = useState({ x: 250, y: 150 });
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState([]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Live mode: update GPS position
  useEffect(() => {
    if (!isLive || !hasGpsFix) return;

    // Simple lat/lon to SVG mapping (placeholder - needs calibration with real GPS data)
    // This is a basic mapping that centers the track around the GPS coordinates
    // TODO: Implement proper bounding box fit with real GPS data
    const newX = 250; // Center X for now
    const newY = 150; // Center Y for now

    setLivePosition({ x: newX, y: newY });

    // Add to breadcrumbs (keep last 500 points)
    setGpsBreadcrumbs(prev => {
      const next = [...prev, { x: newX, y: newY, lat: latitude, lng: longitude }];
      return next.length > 500 ? next.slice(-500) : next;
    });
  }, [isLive, hasGpsFix, latitude, longitude]);

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Map className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">CIRCUIT MAP</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status Chip */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${isDemoMode ? 'bg-primary/10 border-primary/30 text-primary' : isLive ? 'bg-green-500/10 border-green-500/30 text-green-500' : isConnected ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <span>{connectionStatus}</span>
          </div>
          {/* GPS Status */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono ${hasGpsFix ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <Navigation className="w-3 h-3" />
            <span>{hasGpsFix ? `GPS LOCK (${sats} sat)` : `NO GPS (sats: ${sats})`}</span>
          </div>
          {hasGpsFix && (
            <span className="text-[10px] font-mono text-white/30 tabular-nums">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          )}
          <span className="text-[10px] font-mono text-white/20 tracking-widest">METRO CIRCUIT · 1.24 mi / LAP</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Circuit SVG */}
        <div className="col-span-1 lg:col-span-2 rounded border border-white/[0.06] bg-[#101217] p-4">
          <div className="text-[12px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Circuit Layout — Metro Circuit</div>
          <div className="relative flex items-center justify-center" style={{ minHeight: 320 }}>
            <svg ref={svgRef} viewBox="0 0 500 300" className="w-full h-full" style={{ maxHeight: '400px' }}>
              {/* Track outline with class for Anime.js */}
              <path className="circuit circuit-a" d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
                fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
              <path className="circuit" d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
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
              <text x="105" y="155" fill="white" fontSize="11" fontFamily="Orbitron,monospace">S/F</text>
              {/* Pit lane */}
              <path d="M 370 240 L 280 255 Q 240 255 220 215" fill="none" stroke="#FFB300" strokeWidth="2" strokeDasharray="6 3" />
              <text x="290" y="268" fill="#FFB300" fontSize="10" fontFamily="JetBrains Mono,monospace">PIT LANE</text>
              {/* DRS label */}
              <text x="230" y="52" fill="#22c55e" fontSize="12" fontFamily="JetBrains Mono,monospace">DRS ZONE</text>
              {/* Sector labels */}
              <text x="130" y="40"  fill="#22c55e" fontSize="13" fontFamily="Orbitron,monospace" fontWeight="700">S1</text>
              <text x="445" y="155" fill="#eab308" fontSize="13" fontFamily="Orbitron,monospace" fontWeight="700">S2</text>
              <text x="260" y="258" fill="#ef4444" fontSize="13" fontFamily="Orbitron,monospace" fontWeight="700">S3</text>
              {/* Direction arrow */}
              <path d="M 200 65 L 210 60 L 200 55" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
              {/* GPS trace polyline (live mode) */}
              {isLive && gpsBreadcrumbs.length > 1 && (
                <polyline
                  className="trace"
                  points={gpsBreadcrumbs.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#FF1E42"
                  strokeWidth="2"
                  opacity="0.5"
                />
              )}
              {/* Vehicle position marker */}
              {isDemoMode ? (
                <g transform={`translate(${demoPosition.x}, ${demoPosition.y})`}>
                  <circle cx="0" cy="0" r="8" fill="#FF1E42" style={{ filter: 'drop-shadow(0 0 8px #FF1E42)' }} />
                  {/* Heading wedge */}
                  <path d="M 0 -8 L -4 0 L 4 0 Z" fill="#FF1E42" opacity="0.8" />
                </g>
              ) : hasGpsFix ? (
                <g className="car" transform={`translate(${livePosition.x}, ${livePosition.y})`}>
                  <circle cx="0" cy="0" r="8" fill="#FF1E42" style={{ filter: 'drop-shadow(0 0 8px #FF1E42)' }} />
                  {/* Heading wedge */}
                  <path d="M 0 -8 L -4 0 L 4 0 Z" fill="#FF1E42" opacity="0.8" />
                </g>
              ) : (
                <text x="250" y="155" fill="#8A909D" fontSize="12" fontFamily="JetBrains Mono,monospace" textAnchor="middle">
                  {isLive ? `WAITING FOR GPS FIX (sats: ${sats})` : 'WAITING FOR SIGNAL'}
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Right info panel */}
        <div className="flex flex-col gap-3">
          {/* Sector times */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-3">
            <div className="text-[12px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Sector Times (SAMPLE DATA)</div>
            {SECTORS.map(s => (
              <div key={s.id} className="flex items-center gap-3 mb-2 p-2 rounded bg-white/[0.02]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <div className="text-[11px] font-display font-bold text-white/60">{s.name}</div>
                  <div className="text-[10px] font-mono text-white/20">{s.type}{s.drs ? ' · DRS' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-display font-black" style={{ color: s.color }}>{s.time}</div>
                  <div className={`text-[11px] font-mono ${s.delta.startsWith('-') ? 'text-green-400' : 'text-primary'}`}>{s.delta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pit info */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-3">
            <div className="text-[12px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Pit Entry Info (SAMPLE DATA)</div>
            {PIT_INFO.map(p => (
              <div key={p.label} className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono text-white/25">{p.label}</span>
                <span className="text-[12px] font-display font-bold text-[#FFB300]">{p.value}</span>
              </div>
            ))}
          </div>

          {/* Track segments */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-3 flex-1">
            <div className="text-[12px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Track Segments (SAMPLE DATA)</div>
            <div className="space-y-1.5">
              {SEGMENTS.map((seg, i) => (
                <button key={seg.name} onClick={() => setActiveSegment(i)}
                  className={`w-full text-left p-2 rounded border transition-all ${activeSegment === i ? 'border-primary/25 bg-primary/5' : 'border-transparent hover:border-white/[0.04]'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-display font-bold ${activeSegment === i ? 'text-primary' : 'text-white/50'}`}>{seg.name}</span>
                    <span className="text-[10px] font-mono text-white/20">{seg.type}</span>
                  </div>
                  {activeSegment === i && <p className="text-[11px] font-mono text-white/30 mt-1">{seg.note}</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}