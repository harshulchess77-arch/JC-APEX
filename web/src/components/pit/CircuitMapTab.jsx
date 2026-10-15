import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../../hooks/useTelemetry';
import { animate, svg, createScope } from 'animejs';

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

export default function CircuitMapTab() {
  const [activeSegment, setActiveSegment] = useState(0);
  const { telemetry, isDemoMode, isLive, gpsFix, sats } = useTelemetry(null, true);

  // GPS data from telemetry
  const latitude = telemetry?.latitude ?? 0;
  const longitude = telemetry?.longitude ?? 0;
  const hasGpsFix = gpsFix ?? (latitude !== 0 && longitude !== 0);

  // Refs for Anime.js animations
  const svgRef = useRef(null);
  const scopeRef = useRef(null);
  const drawAnimRef = useRef(null);
  const carAnimRef = useRef(null);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  // Demo position calculation (track path following)
  const [demoPosition, setDemoPosition] = useState({ x: 100, y: 150 });
  useEffect(() => {
    if (!isDemoMode) return;
    const updateDemoPosition = () => {
      const lapProgress = (telemetry?.lap % 1) || 0;
      const angle = lapProgress * Math.PI * 2;
      let x = 100, y = 150;
      
      if (angle < Math.PI / 2) {
        // Sector 1: (100,150) to (150,60) to (350,60)
        const subProgress = angle / (Math.PI / 2);
        if (subProgress < 0.3) {
          const t = subProgress / 0.3;
          x = 100 + t * 50;
          y = 150 - t * 90;
        } else {
          const t = (subProgress - 0.3) / 0.7;
          x = 150 + t * 200;
          y = 60;
        }
      } else if (angle < Math.PI) {
        // Sector 2: (350,60) to (440,150) to (370,240)
        const subProgress = (angle - Math.PI / 2) / (Math.PI / 2);
        if (subProgress < 0.5) {
          const t = subProgress / 0.5;
          x = 350 + t * 90;
          y = 60 + t * 90;
        } else {
          const t = (subProgress - 0.5) / 0.5;
          x = 440 - t * 70;
          y = 150 + t * 90;
        }
      } else if (angle < Math.PI * 1.5) {
        // Sector 3: (370,240) to (280,240) to (220,200) to (160,160)
        const subProgress = (angle - Math.PI) / (Math.PI / 2);
        if (subProgress < 0.25) {
          const t = subProgress / 0.25;
          x = 370 - t * 90;
          y = 240;
        } else if (subProgress < 0.5) {
          const t = (subProgress - 0.25) / 0.25;
          x = 280 - t * 60;
          y = 240 - t * 40;
        } else if (subProgress < 0.75) {
          const t = (subProgress - 0.5) / 0.25;
          x = 220 - t * 60;
          y = 200 - t * 40;
        } else {
          const t = (subProgress - 0.75) / 0.25;
          x = 160 - t * 60;
          y = 160 - t * 10;
        }
      } else {
        // Back to start
        const subProgress = (angle - Math.PI * 1.5) / (Math.PI / 2);
        const t = subProgress;
        x = 100 - t * 0;
        y = 150 - t * 0;
      }
      setDemoPosition({ x, y });
    };
    updateDemoPosition();
    const interval = setInterval(updateDemoPosition, 100);
    return () => clearInterval(interval);
  }, [isDemoMode, telemetry?.lap]);

  // Live position (placeholder for GPS - use center for now)
  const livePosition = { x: 250, y: 150 };

  // Anime.js track draw-in
  useEffect(() => {
    if (!svgRef.current || hasPlayedIntro) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setHasPlayedIntro(true);
      return;
    }
    const scope = createScope({ root: svgRef.current });
    scopeRef.current = scope;
    const drawAnim = animate(svg.createDrawable('.circuit'), {
      draw: '0 1',
      duration: 1400,
      easing: 'outQuad',
    });
    drawAnimRef.current = drawAnim;
    setHasPlayedIntro(true);
    return () => {
      scope.revert();
      drawAnimRef.current = null;
    };
  }, [hasPlayedIntro]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scopeRef.current) scopeRef.current.revert();
      if (drawAnimRef.current) drawAnimRef.current = null;
      if (carAnimRef.current) carAnimRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Header with GPS status */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-display font-bold tracking-widest text-white/40 uppercase">Circuit Map</div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7px] font-mono ${isDemoMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : isLive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <span>{isDemoMode ? 'DEMO' : isLive ? 'LIVE' : 'NO SIGNAL'}</span>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7px] font-mono ${hasGpsFix ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <span>{hasGpsFix ? `GPS LOCK (${sats} sat)` : 'NO GPS FIX'}</span>
          </div>
        </div>
      </div>

      {/* Circuit SVG */}
      <div className="rounded border border-white/[0.06] bg-[#101217] glass p-2">
        <div className="relative flex items-center justify-center" style={{ height: 220 }}>
          <svg viewBox="0 0 500 300" className="w-full h-full" ref={svgRef}>
            <path className="circuit" d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
              fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
            <path className="circuit" d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
              fill="none" stroke="#222" strokeWidth="18" strokeLinejoin="round" />
            <path d="M 150 60 L 350 60" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }} />
            <circle cx="150" cy="60" r="6" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
            <circle cx="440" cy="150" r="6" fill="#eab308" style={{ filter: 'drop-shadow(0 0 4px #eab308)' }} />
            <circle cx="280" cy="240" r="6" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
            <line x1="100" y1="140" x2="100" y2="160" stroke="white" strokeWidth="3" />
            <text x="105" y="155" fill="white" fontSize="9" fontFamily="Orbitron,monospace">S/F</text>
            <path d="M 370 240 L 280 255 Q 240 255 220 215" fill="none" stroke="#FFB300" strokeWidth="2" strokeDasharray="6 3" />
            <text x="290" y="268" fill="#FFB300" fontSize="8" fontFamily="JetBrains Mono,monospace">PIT LANE</text>
            <text x="230" y="52" fill="#22c55e" fontSize="10" fontFamily="JetBrains Mono,monospace">DRS ZONE</text>
            <text x="130" y="40"  fill="#22c55e" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S1</text>
            <text x="445" y="155" fill="#eab308" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S2</text>
            <text x="260" y="258" fill="#ef4444" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S3</text>
            <path d="M 200 65 L 210 60 L 200 55" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
            {isDemoMode ? (
              <g className="car">
                <circle cx={demoPosition.x} cy={demoPosition.y} r="8" fill="#FF1E42" style={{ filter: 'drop-shadow(0 0 8px #FF1E42)' }} />
                <path d={'M ' + demoPosition.x + ' ' + (demoPosition.y - 12) + ' L ' + (demoPosition.x - 4) + ' ' + (demoPosition.y - 2) + ' L ' + (demoPosition.x + 4) + ' ' + (demoPosition.y - 2) + ' Z'} fill="#FF1E42" />
              </g>
            ) : hasGpsFix ? (
              <g className="car">
                <circle cx={livePosition.x} cy={livePosition.y} r="8" fill="#FF1E42" style={{ filter: 'drop-shadow(0 0 8px #FF1E42)' }} />
                <path d={'M ' + livePosition.x + ' ' + (livePosition.y - 12) + ' L ' + (livePosition.x - 4) + ' ' + (livePosition.y - 2) + ' L ' + (livePosition.x + 4) + ' ' + (livePosition.y - 2) + ' Z'} fill="#FF1E42" />
              </g>
            ) : (
              <text x="250" y="155" fill="#8A909D" fontSize="10" fontFamily="JetBrains Mono,monospace" textAnchor="middle">WAITING FOR GPS FIX</text>
            )}
          </svg>
        </div>
      </div>

      {/* Info panels */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-white/[0.06] bg-[#101217] glass p-2">
          <div className="text-[10px] font-display font-bold tracking-widest text-white/40 uppercase mb-2">Sector Times (SAMPLE DATA)</div>
          {SECTORS.map(s => (
            <div key={s.id} className="flex items-center gap-2 mb-1 p-1.5 rounded bg-white/[0.02]">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <div className="flex-1">
                <div className="text-[10px] font-display font-bold text-white/60">{s.name}</div>
                <div className="text-[8px] font-mono text-white/20">{s.type}{s.drs ? ' · DRS' : ''}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-display font-black" style={{ color: s.color }}>{s.time}</div>
                <div className="text-[9px] font-mono {s.delta.startsWith('-') ? 'text-green-400' : 'text-primary'}">{s.delta}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded border border-white/[0.06] bg-[#101217] glass p-2">
          <div className="text-[10px] font-display font-bold tracking-widest text-white/40 uppercase mb-2">Track Segments (SAMPLE DATA)</div>
          <div className="space-y-1">
            {SEGMENTS.map((seg, i) => (
              <button key={seg.name} onClick={() => setActiveSegment(i)}
                className={'w-full text-left p-1.5 rounded border transition-all ' + (activeSegment === i ? 'border-primary/25 bg-primary/5' : 'border-transparent hover:border-white/[0.04]')}>
                <div className="flex items-center justify-between">
                  <span className={'text-[10px] font-display font-bold ' + (activeSegment === i ? 'text-primary' : 'text-white/50')}>{seg.name}</span>
                  <span className="text-[8px] font-mono text-white/20">{seg.type}</span>
                </div>
                {activeSegment === i && <p className="text-[9px] font-mono text-white/30 mt-1">{seg.note}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
