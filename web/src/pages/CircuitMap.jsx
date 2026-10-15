import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Navigation } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
// Anime.js v4 integration
import { animate, svg, createScope } from 'animejs';
import CircuitSVG from './circuit-map/CircuitSVG';
import InfoPanel from './circuit-map/InfoPanel';
import { useGpsTracking } from './circuit-map/useGpsTracking';
import { fitGpsToSvg, getGpsBounds } from './circuit-map/gps-utils';

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

  // GPS tracking
  const {
    gpsBreadcrumbs,
    gpsLearnedPath,
    handleSetStartFinish,
  } = useGpsTracking({
    hasGpsFix,
    isLive,
    isDemoMode,
    latitude,
    longitude,
    telemetry,
  });

  const [isSchematicMode, setIsSchematicMode] = useState(true);

  // Calculate live position from GPS
  const bounds = getGpsBounds(gpsBreadcrumbs);
  const livePosition = hasGpsFix && bounds && latitude != null && longitude != null ? fitGpsToSvg(latitude, longitude, bounds) : { x: 250, y: 150 };

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
          {hasGpsFix && latitude != null && longitude != null && (
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
            <CircuitSVG
              svgRef={svgRef}
              isSchematicMode={isSchematicMode}
              gpsLearnedPath={gpsLearnedPath}
              showGpsTrace={true}
              bounds={bounds}
              gpsBreadcrumbs={gpsBreadcrumbs}
              demoPosition={demoPosition}
              livePosition={livePosition}
              isDemoMode={isDemoMode}
              hasGpsFix={hasGpsFix}
            />
          </div>
        </div>

        {/* Right info panel */}
        <InfoPanel activeSegment={activeSegment} setActiveSegment={setActiveSegment} />
      </div>
    </div>
  );
}
