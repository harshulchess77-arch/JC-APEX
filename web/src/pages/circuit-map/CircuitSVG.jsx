import React, { useEffect, useRef } from 'react';
import { fitGpsToSvg, getGpsBounds } from './gps-utils';
import OvalTrackGeometry from '@/lib/OvalTrackGeometry';

export default function CircuitSVG({
  svgRef,
  isSchematicMode,
  gpsLearnedPath,
  showGpsTrace,
  bounds,
  gpsBreadcrumbs,
  demoPosition,
  livePosition,
  isDemoMode,
  hasGpsFix,
}) {
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

  const ovalPath = trackGeometryRef.current ? trackGeometryRef.current.getSVGPath() : '';

  return (
    <svg viewBox="0 0 500 300" className="w-full h-full max-h-80" ref={svgRef}>
      <defs>
        {/* Hidden path for GPS-learned track outline (for morphing) */}
        {gpsLearnedPath && (
          <path id="circuit-b" d={gpsLearnedPath} fill="none" stroke="#10B981" strokeWidth="18" strokeLinejoin="round" style={{ display: 'none' }} />
        )}
      </defs>
      {/* Track outline with class for Anime.js - OVAL GEOMETRY */}
      {!isSchematicMode && gpsLearnedPath ? (
        <path className="circuit circuit-a" d={gpsLearnedPath}
          fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
      ) : (
        <path className="circuit circuit-a" d={ovalPath}
          fill="none" stroke="#1a1a1a" strokeWidth="22" strokeLinejoin="round" />
      )}
      {!isSchematicMode && gpsLearnedPath ? (
        <path className="circuit" d={gpsLearnedPath}
          fill="none" stroke="#222" strokeWidth="18" strokeLinejoin="round" />
      ) : (
        <path className="circuit" d={ovalPath}
          fill="none" stroke="#222" strokeWidth="18" strokeLinejoin="round" />
      )}
      {/* GPS trace polyline (visible in live mode when learning) */}
      {showGpsTrace && bounds && gpsBreadcrumbs.length > 2 && (
        <polyline
          className="trace"
          points={gpsBreadcrumbs.map(p => {
            if (p.lat == null || p.lon == null) return '';
            const pos = fitGpsToSvg(p.lat, p.lon, bounds);
            return `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
          }).filter(Boolean).join(' ')}
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.6"
        />
      )}
      {/* DRS zone - positioned on oval track */}
      <path d="M 70 110 L 200 110" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }} />
      {/* Sector markers - oval track positions */}
      <circle cx="200" cy="110" r="6" fill="#22c55e" style={{ filter: 'drop-shadow(0 0 4px #22c55e)' }} />
      <circle cx="430" cy="150" r="6" fill="#eab308" style={{ filter: 'drop-shadow(0 0 4px #eab308)' }} />
      <circle cx="200" cy="190" r="6" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }} />
      {/* Start/Finish - oval track position */}
      <line x1="70" y1="140" x2="70" y2="160" stroke="white" strokeWidth="3" />
      <text x="75" y="155" fill="white" fontSize="9" fontFamily="Orbitron,monospace">S/F</text>
      {/* Pit lane - oval track */}
      <path d="M 200 190 L 80 205 Q 40 205 40 165" fill="none" stroke="#FFB300" strokeWidth="2" strokeDasharray="6 3" />
      <text x="80" y="218" fill="#FFB300" fontSize="8" fontFamily="JetBrains Mono,monospace">PIT LANE</text>
      {/* DRS label */}
      <text x="120" y="102" fill="#22c55e" fontSize="10" fontFamily="JetBrains Mono,monospace">DRS ZONE</text>
      {/* Sector labels */}
      <text x="180" y="90"  fill="#22c55e" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S1</text>
      <text x="435" y="155" fill="#eab308" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S2</text>
      <text x="180" y="205" fill="#ef4444" fontSize="11" fontFamily="Orbitron,monospace" fontWeight="700">S3</text>
      {/* Direction arrow */}
      <path d="M 120 115 L 130 110 L 120 105" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
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
  );
}
