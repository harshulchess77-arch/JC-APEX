import { useState, useEffect } from 'react';
import { fitGpsToSvg, getGpsBounds } from './gps-utils';
import { logger } from '@/utils/logger';

export function useGpsTracking({ hasGpsFix, isLive, isDemoMode, latitude, longitude, telemetry }) {
  const [gpsBreadcrumbs, setGpsBreadcrumbs] = useState([]);
  const [startFinishPoint, setStartFinishPoint] = useState(null);
  const [showGpsTrace, setShowGpsTrace] = useState(true);
  const [gpsLearnedPath, setGpsLearnedPath] = useState(null);

  // Add GPS breadcrumbs when new valid data arrives
  useEffect(() => {
    if (hasGpsFix && isLive && !isDemoMode && latitude != null && longitude != null) {
      const now = Date.now();
      setGpsBreadcrumbs(prev => {
        // Add new point if moved > 1 meter from last point
        const lastPoint = prev[prev.length - 1];
        const distance = lastPoint && lastPoint.lat != null && lastPoint.lon != null
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
      const bounds = getGpsBounds(gpsBreadcrumbs);
      if (!bounds) return;
      
      // Simple path generation: connect points in order
      const points = gpsBreadcrumbs
        .filter(p => p.lat != null && p.lon != null)
        .map(p => {
          const pos = fitGpsToSvg(p.lat, p.lon, bounds);
          return `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
        });
      
      if (points.length > 0) {
        const pathD = `M ${points.join(' L ')}`;
        setGpsLearnedPath(pathD);
      }
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
        logger.log('[CircuitMap] Lap completed, ready to morph to GPS-learned track');
        // Morph animation would be triggered here using Anime.js morphTo
        // animate('.circuit-a', { d: morphTo('#circuit-b'), duration: 900, ease: 'inOutQuad' });
      }
    }
  }, [gpsBreadcrumbs, startFinishPoint, telemetry?.lap]);

  const handleSetStartFinish = () => {
    if (hasGpsFix && latitude != null && longitude != null) {
      setStartFinishPoint({ lat: latitude, lon: longitude, time: Date.now() });
      setGpsBreadcrumbs([]); // Reset breadcrumbs for new lap learning
      setShowGpsTrace(true);
    }
  };

  return {
    gpsBreadcrumbs,
    startFinishPoint,
    showGpsTrace,
    gpsLearnedPath,
    handleSetStartFinish,
  };
}
