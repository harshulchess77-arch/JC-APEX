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
import OvalTrackGeometry from '@/lib/OvalTrackGeometry';

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

  // Oval track geometry for precise positioning
  const trackGeometryRef = useRef(null);
  useEffect(() => {
    trackGeometryRef.current = new OvalTrackGeometry({
      centerX: 250,
      centerY: 150,
      majorAxis: 200,
      minorAxis: 80,
      cornerRadius: 40,
      trackWidth: 22,
    });
  }, []);

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

  // Demo mode: simulate vehicle position on oval track using precise geometry
  const [demoPosition, setDemoPosition] = useState({ x: 70, y: 150, lap: 0 });
  useEffect(() => {
    if (isDemoMode && trackGeometryRef.current) {
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
        // Fallback to oval geometry-based calculation if reduced motion or no scope
        const interval = setInterval(() => {
          const lapProgress = (telemetry?.lap || 0) % 1;
          const arcLength = lapProgress * trackGeometryRef.current.totalLength;
          const position = trackGeometryRef.current.getPositionFromArcLength(arcLength);
          setDemoPosition({
            x: position.x,
            y: position.y,
            lap: Math.floor(telemetry?.lap || 0),
          });
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
          <span className="text-[8px] font-mono text-white/20 tracking-widest">OVAL TRACK · 1.22 mi / LAP</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Circuit SVG */}
        <div className="col-span-1 lg:col-span-2 rounded border border-white/[0.06] bg-[#101217] glass p-4">
          <div className="text-[11px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Circuit Layout — Oval Track</div>
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
