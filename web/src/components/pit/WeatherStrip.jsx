import React from 'react';
import { Thermometer, CloudRain, Wind, Droplets } from 'lucide-react';
import { useWeather } from '@/lib/WeatherContext';

export default function WeatherStrip() {
  const { weather, getWeatherRiskLevel, getEnergyAdjustmentFactor } = useWeather();

  const {
    ambientTemp,
    trackTemp,
    rainProbability,
    windSpeed,
    windDirection,
    gripCoefficient,
    humidity,
  } = weather;

  const riskLevel = getWeatherRiskLevel();
  const energyFactor = getEnergyAdjustmentFactor();

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#FF1E42';
      case 'HIGH': return '#FFB300';
      case 'MODERATE': return '#FFA500';
      default: return '#10B981';
    }
  };

  const getGripColor = (grip) => {
    if (grip > 0.85) return '#10B981';
    if (grip > 0.7) return '#FFB300';
    return '#FF1E42';
  };

  const riskColor = getRiskColor(riskLevel);
  const gripColor = getGripColor(gripCoefficient);

  const windDirectionText = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <div className="p-3 border-b border-white/[0.06]">
      <div className="flex items-center gap-1.5 mb-2">
        <CloudRain className="w-2.5 h-2.5 text-primary" />
        <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase">Live Weather · Grip Analysis</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Thermometer className="w-2.5 h-2.5" style={{ color: riskColor }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">AMBIENT</span>
          </div>
          <div className="text-sm font-display font-black" style={{ color: riskColor }}>{ambientTemp.toFixed(1)}°C</div>
        </div>
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Thermometer className="w-2.5 h-2.5" style={{ color: riskColor }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">TRACK</span>
          </div>
          <div className="text-sm font-display font-black" style={{ color: riskColor }}>{trackTemp.toFixed(1)}°C</div>
        </div>
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Droplets className="w-2.5 h-2.5" style={{ color: riskColor }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">HUMIDITY</span>
          </div>
          <div className="text-sm font-display font-black" style={{ color: riskColor }}>{humidity}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <CloudRain className="w-2.5 h-2.5" style={{ color: riskColor }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">RAIN</span>
          </div>
          <div className="text-sm font-display font-black" style={{ color: riskColor }}>{rainProbability}%</div>
        </div>
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Wind className="w-2.5 h-2.5" style={{ color: riskColor }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">WIND</span>
          </div>
          <div className="text-sm font-display font-black" style={{ color: riskColor }}>{windSpeed.toFixed(1)} {windDirectionText(windDirection)}</div>
        </div>
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Droplets className="w-2.5 h-2.5" style={{ color: gripColor }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">GRIP</span>
          </div>
          <div className="text-sm font-display font-black" style={{ color: gripColor }}>{(gripCoefficient * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between text-[7px] font-mono text-white/20">
          <span>RISK LEVEL:</span>
          <span className="font-bold tracking-wider" style={{ color: riskColor }}>{riskLevel}</span>
        </div>
        <div className="flex items-center justify-between text-[7px] font-mono text-white/20">
          <span>ENERGY FACTOR:</span>
          <span className="font-bold tracking-wider" style={{ color: energyFactor > 1.2 ? '#FF1E42' : energyFactor > 1.0 ? '#FFB300' : '#10B981' }}>
            x{energyFactor.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}