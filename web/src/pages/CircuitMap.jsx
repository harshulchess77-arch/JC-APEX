import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Navigation } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
// Anime.js v4 integration
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

export default function CircuitMap() {
  const navigate = useNavigate();
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

  // Anime.js setup with scope
  useEffect(() => {
    if (!svgRef.current) return;

    // Create scope to isolate animations to this SVG
    scopeRef.current = createScope({ root: svgRef.current });

    // Intro animation: draw-in the circuit path
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && !hasPlayedIntro) {
      const scope = scopeRef.current;
      const [drawable] = svg.createDrawable('.circuit');
      drawAnimRef.current = scope.add(drawable, {
        draw: '0 1',
        duration: 1400,
        ease: 'outQuad',
      });

      setHasPlayedIntro(true);
    }

    return () => {
      if (scopeRef.current) {
        scopeRef.current.revert();
      }
    };
  }, [hasPlayedIntro]);

  // Demo mode: simulate vehicle position on track (follows drawn track path)
  const [demoPosition, setDemoPosition] = useState({ x: 60, y: 150, lap: 0 });
  useEffect(() => {
    if (isDemoMode) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion && scopeRef.current) {
        // Use Anime.js createMotionPath for smooth track following
        const scope = scopeRef.current;
        const motionPath = svg.createMotionPath('.circuit');
        carAnimRef.current = scope.add('.car', {
          ...motionPath,
          duration: 63000, // 63 seconds per lap (matches demo sim period)
          ease: 'linear',
          loop: true,
        });
      } else {
        // Fallback to manual calculation if reduced motion or no scope
        const interval = setInterval(() => {
          const lapProgress = (telemetry?.lap || 0) % 1;
          // Track path based on SVG path: Metro Circuit
          // Path: M 60 150 → Q 60 60 150 60 → L 350 60 → Q 440 60 440 150 → Q 440 220 370 240 → L 280 240 → Q 240 240 220 200 → Q 200 160 160 160 → Q 100 160 60 150
          const angle = lapProgress * Math.PI * 2;
          let x, y;
          if (angle < Math.PI / 2) {
            // Sector 1: Start (60,150) to (150,60) to (350,60)
            const subProgress = angle / (Math.PI / 2);
            if (subProgress < 0.3) {
              // Curve to (150,60)
              const t = subProgress / 0.3;
              x = 60 + t * 90;
              y = 150 - t * 90;
            } else {
              // Straight to (350,60)
              const t = (subProgress - 0.3) / 0.7;
              x = 150 + t * 200;
              y = 60;
            }
          } else if (angle < Math.PI) {
            // Sector 2: (350,60) to (440,150) to (370,240)
            const subProgress = (angle - Math.PI / 2) / (Math.PI / 2);
            if (subProgress < 0.5) {
              // Curve to (440,150)
              const t = subProgress / 0.5;
              x = 350 + t * 90;
              y = 60 + t * 90;
            } else {
              // Curve to (370,240)
              const t = (subProgress - 0.5) / 0.5;
              x = 440 - t * 70;
              y = 150 + t * 90;
            }
          } else if (angle < Math.PI * 1.5) {
            // Sector 3: (370,240) to (280,240) to (220,200) to (160,160)
            const subProgress = (angle - Math.PI) / (Math.PI / 2);
            if (subProgress < 0.25) {
              // Straight to (280,240)
              const t = subProgress / 0.25;
              x = 370 - t * 90;
              y = 240;
            } else if (subProgress < 0.5) {
              // Curve to (220,200)
              const t = (subProgress - 0.25) / 0.25;
              x = 280 - t * 60;
              y = 240 - t * 40;
            } else {
              // Curve to (160,160)
              const t = (subProgress - 0.5) / 0.5;
              x = 220 - t * 60;
              y = 200 - t * 40;
            }
          } else {
            // Sector 4: (160,160) back to (60,150)
            const subProgress = (angle - Math.PI * 1.5) / (Math.PI / 2);
            x = 160 - subProgress * 100;
            y = 160 - subProgress * 10;
          }
          setDemoPosition({ x, y, lap: Math.floor(telemetry?.lap || 0) });
        }, 200);
        return () => clearInterval(interval);
      }

      return () => {
        if (carAnimRef.current) {
          carAnimRef.current.revert();
        }
      };
    }
  }, [isDemoMode, telemetry?.lap]);

  // Live mode: lat/lon to SVG mapping
  // GPS breadcrumb array for track learning
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState([]);
  const [startFinishPoint, setStartFinishPoint] = useState(null);
  const [showGpsTrace, setShowGpsTrace] = useState(true);
  const [gpsLearnedPath, setGpsLearnedPath] = useState(null);
  const [isSchematicMode, setIsSchematicMode] = useState(true);

  // Fit GPS bounding box into SVG viewBox (500x300)
  const fitGpsToSvg = (lat, lon, bounds) => {
    if (!bounds) return { x: 250, y: 150 };
    const padding = 20;
    const svgWidth = 500 - padding * 2;
    const svgHeight = 300 - padding * 2;
    
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * svgWidth + padding;
    const y = svgHeight - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * svgHeight + padding;
    
    return { x, y };
  };

  // Calculate bounds from breadcrumbs
  const getGpsBounds = () => {
    if (gpsBreadcrumbs.length === 0) return null;
    const lats = gpsBreadcrumbs.map(p => p.lat);
    const lons = gpsBreadcrumbs.map(p => p.lon);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
    };
  };

  // Calculate live position from GPS
  const bounds = getGpsBounds();
  const livePosition = hasGpsFix && bounds ? fitGpsToSvg(latitude, longitude, bounds) : { x: 250, y: 150 };

  // Add GPS breadcrumbs when new valid data arrives
  useEffect(() => {
    if (hasGpsFix && isLive && !isDemoMode) {
      const now = Date.now();
      setGpsBreadcrumbs(prev => {
        // Add new point if moved > 1 meter from last point
        const lastPoint = prev[prev.length - 1];
        const distance = lastPoint 
          ? Math.sqrt(Math.pow(latitude - lastPoint.lat, 2) + Math.pow(longitude - lastPoint.lon, 2)) * 111000 
          : 1000; // Approximate 1 degree ≈ 111km
        
        if (distance > 1) {
          const next = [...prev, { lat, lon, time: now }];
          return next.length > 500 ? next.slice(-500) : next;
        }
        return prev;
      });
    }
  }, [latitude, longitude, hasGpsFix, isLive, isDemoMode]);

  // Generate smoothed SVG path from GPS breadcrumbs
  useEffect(() => {
    if (gpsBreadcrumbs.length > 50) {
      const bounds = getGpsBounds();
      if (!bounds) return;
      
      // Simple path generation: connect points in order
      const points = gpsBreadcrumbs.map(p => {
        const pos = fitGpsToSvg(p.lat, p.lon, bounds);
        return `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
      });
      
      const pathD = `M ${points.join(' L ')}`;
      setGpsLearnedPath(pathD);
    }
  }, [gpsBreadcrumbs]);

  // Check if we completed a lap (returned near S/F after traveling > 50m)
  useEffect(() => {
    if (startFinishPoint && gpsBreadcrumbs.length > 50) {
      const lastPoint = gpsBreadcrumbs[gpsBreadcrumbs.length - 1];
      const distance = Math.sqrt(
        Math.pow(lastPoint.lat - startFinishPoint.lat, 2) + 
        Math.pow(lastPoint.lon - startFinishPoint.lon, 2)
      ) * 111000;
      
      if (distance < 0.015 && telemetry?.lap > 1) { // Within ~15m
        // Lap completed - trigger morph
        console.log('[CircuitMap] Lap completed, ready to morph to GPS-learned track');
        // Morph animation would be triggered here using Anime.js morphTo
        // animate('.circuit-a', { d: morphTo('#circuit-b'), duration: 900, ease: 'inOutQuad' });
      }
    }
  }, [gpsBreadcrumbs, startFinishPoint, telemetry?.lap]);

  // Morph animation when switching between schematic and GPS trace
  // Note: morphTo from Anime.js v4 requires specific API usage
  // For now, we toggle visibility instead of morphing
  useEffect(() => {
    // Placeholder for morph animation
    // This would use animate() with morphTo once API is verified
  }, [isSchematicMode, gpsLearnedPath]);

  const handleSetStartFinish = () => {
    if (hasGpsFix) {
      setStartFinishPoint({ lat: latitude, lon: longitude, time: Date.now() });
      setGpsBreadcrumbs([]); // Reset breadcrumbs for new lap learning
      setShowGpsTrace(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] glass flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Map className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">CIRCUIT MAP</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[7px] font-mono ${isDemoMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : isLive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <span>{isDemoMode ? 'DEMO' : isLive ? 'LIVE' : 'NO SIGNAL'}</span>
          </div>
          {/* GPS Status */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[7px] font-mono ${hasGpsFix ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
            <Navigation className="w-2.5 h-2.5" />
            <span>{hasGpsFix ? `GPS LOCK (${sats} sat)` : 'NO GPS FIX'}</span>
          </div>
          {hasGpsFix && (
            <span className="text-[8px] font-mono text-white/30 tabular-nums">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          )}
          {/* SET S/F Button (Live mode only) */}
          {isLive && hasGpsFix && (
            <button
              onClick={handleSetStartFinish}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-[7px] font-mono text-primary hover:bg-primary/20 transition-colors"
            >
              SET S/F
            </button>
          )}
          {/* Schematic/GPS Trace Toggle (after learning) */}
          {gpsLearnedPath && (
            <button
              onClick={() => setIsSchematicMode(!isSchematicMode)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[7px] font-mono transition-colors ${
                isSchematicMode 
                  ? 'border-white/20 bg-white/5 text-white/40' 
                  : 'border-green-500/30 bg-green-500/10 text-green-400'
              }`}
            >
              {isSchematicMode ? 'SCHEMATIC' : 'GPS TRACE'}
            </button>
          )}
          <span className="text-[8px] font-mono text-white/20 tracking-widest">METRO CIRCUIT · 1.24 mi / LAP</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Circuit SVG */}
        <div className="col-span-1 lg:col-span-2 rounded border border-white/[0.06] bg-[#101217] glass p-4">
          <div className="text-[11px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Circuit Layout — Metro Circuit</div>
          <div className="relative flex items-center justify-center" style={{ height: 320 }}>
            <svg viewBox="0 0 500 300" className="w-full h-full max-h-80" ref={svgRef}>
              <defs>
                {/* Hidden path for GPS-learned track outline (for morphing) */}
                {gpsLearnedPath && (
                  <path id="circuit-b" d={gpsLearnedPath} fill="none" stroke="#10B981" strokeWidth="18" strokeLinejoin="round" style={{ display: 'none' }} />
                )}
              </defs>
              {/* Track outline with class for Anime.js */}
              {!isSchematicMode && gpsLearnedPath ? (
                <path className="circuit circuit-a" d={gpsLearnedPath}
                  fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
              ) : (
                <path className="circuit circuit-a" d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
                  fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
              )}
              {!isSchematicMode && gpsLearnedPath ? (
                <path className="circuit" d={gpsLearnedPath}
                  fill="none" stroke="#222" strokeWidth="18" strokeLinejoin="round" />
              ) : (
                <path className="circuit" d="M 60 150 Q 60 60 150 60 L 350 60 Q 440 60 440 150 Q 440 220 370 240 L 280 240 Q 240 240 220 200 Q 200 160 160 160 Q 100 160 60 150 Z"
                  fill="none" stroke="#222" strokeWidth="18" strokeLinejoin="round" />
              )}
              {/* GPS trace polyline (visible in live mode when learning) */}
              {showGpsTrace && bounds && gpsBreadcrumbs.length > 2 && (
                <polyline
                  className="trace"
                  points={gpsBreadcrumbs.map(p => {
                    const pos = fitGpsToSvg(p.lat, p.lon, bounds);
                    return `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
              )}
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
              <path d="M 370 240 L 280 255 Q 240 255 220 215" fill="none" stroke="#FFB300" strokeWidth="2" strokeDasharray="6 3" />
              <text x="290" y="268" fill="#FFB300" fontSize="8" fontFamily="JetBrains Mono,monospace">PIT LANE</text>
              {/* DRS label */}
              <text x="230" y="52" fill="#22c55e" fontSize="10" fontFamily="JetBrains Mono,monospace">DRS ZONE</text>
              {/* Sector labels */}
              <text x="130" y="40"  fill="#22c55e" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S1</text>
              <text x="445" y="155" fill="#eab308" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S2</text>
              <text x="260" y="258" fill="#ef4444" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S3</text>
              {/* Direction arrow */}
              <path d="M 200 65 L 210 60 L 200 55" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
              {/* Vehicle position marker with class for Anime.js */}
              {isDemoMode ? (
                <g className="car">
                  <circle
                    cx={demoPosition.x}
                    cy={demoPosition.y}
                    r="8"
                    fill="#FF1E42"
                    style={{ filter: 'drop-shadow(0 0 8px #FF1E42)' }}
                  />
                  {/* Heading wedge */}
                  <path
                    d={`M ${demoPosition.x} ${demoPosition.y - 12} L ${demoPosition.x - 4} ${demoPosition.y - 2} L ${demoPosition.x + 4} ${demoPosition.y - 2} Z`}
                    fill="#FF1E42"
                  />
                </g>
              ) : hasGpsFix ? (
                <g className="car">
                  <circle
                    cx={livePosition.x}
                    cy={livePosition.y}
                    r="8"
                    fill="#FF1E42"
                    style={{ filter: 'drop-shadow(0 0 8px #FF1E42)' }}
                  />
                  {/* Heading wedge */}
                  <path
                    d={`M ${livePosition.x} ${livePosition.y - 12} L ${livePosition.x - 4} ${livePosition.y - 2} L ${livePosition.x + 4} ${livePosition.y - 2} Z`}
                    fill="#FF1E42"
                  />
                </g>
              ) : (
                <text x="250" y="155" fill="#8A909D" fontSize="10" fontFamily="JetBrains Mono,monospace" textAnchor="middle">
                  WAITING FOR GPS FIX
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Right info panel */}
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
      </div>
    </div>
  );
}