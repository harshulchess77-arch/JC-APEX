import React, { useState, useEffect } from 'react';
import { Thermometer, CloudRain } from 'lucide-react';

export default function WeatherStrip() {
  const [trackTemp, setTrackTemp] = useState(32);
  const [rainProb, setRainProb] = useState(15);

  useEffect(() => {
    const i = setInterval(() => {
      setTrackTemp(t => Math.max(15, Math.min(55, +(t + (Math.random() - 0.5)).toFixed(1))));
      setRainProb(p => Math.max(0, Math.min(100, Math.round(p + (Math.random() - 0.5) * 6))));
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const rainClr = rainProb > 60 ? '#FF1E42' : rainProb > 30 ? '#FFB300' : '#10B981';
  const tempClr = trackTemp > 45 ? '#FF1E42' : trackTemp > 30 ? '#FFB300' : '#10B981';
  const risk = rainProb > 60 ? 'HIGH RAIN RISK' : rainProb > 30 ? 'WATCH RAIN' : 'OPTIMAL DRY';

  return (
    <div className="p-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-1.5 mb-2">
        <CloudRain className="w-2.5 h-2.5 text-primary" />
        <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Weather · Track Temp</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Thermometer className="w-2.5 h-2.5" style={{ color: tempClr }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">TRACK</span>
          </div>
          <div className="text-base font-display font-black" style={{ color: tempClr }}>{trackTemp.toFixed(1)}°C</div>
        </div>
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <CloudRain className="w-2.5 h-2.5" style={{ color: rainClr }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">RAIN</span>
          </div>
          <div className="text-base font-display font-black" style={{ color: rainClr }}>{rainProb}%</div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[7px] font-mono text-white/20">
        <span>CONDITIONS:</span>
        <span className="font-bold tracking-wider" style={{ color: rainClr }}>{risk}</span>
      </div>
    </div>
  );
}