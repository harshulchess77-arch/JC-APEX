// Fit GPS bounding box into SVG viewBox (500x300)
export function fitGpsToSvg(lat, lon, bounds) {
  if (!bounds || lat == null || lon == null) return { x: 250, y: 150 };
  const padding = 20;
  const svgWidth = 500 - padding * 2;
  const svgHeight = 300 - padding * 2;
  
  const lonRange = bounds.maxLon - bounds.minLon || 0.001; // Avoid division by zero
  const latRange = bounds.maxLat - bounds.minLat || 0.001;
  
  const x = ((lon - bounds.minLon) / lonRange) * svgWidth + padding;
  const y = svgHeight - ((lat - bounds.minLat) / latRange) * svgHeight + padding;
  
  return { x, y };
}

// Calculate bounds from breadcrumbs
export function getGpsBounds(gpsBreadcrumbs) {
  if (gpsBreadcrumbs.length === 0) return null;
  const lats = gpsBreadcrumbs.map(p => p.lat);
  const lons = gpsBreadcrumbs.map(p => p.lon);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}
