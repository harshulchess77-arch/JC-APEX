import React, { useState, useEffect } from 'react';
import { Brain, Zap, Droplets, Wind, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAIOracle, getAIColor, getAIBackground, AI_PRIORITY, AI_CATEGORY } from '@/hooks/useAIOracle';
import { useWeather } from '@/lib/WeatherContext';

export default function AIOraclePanel() {
  const { recommendations, energyForecast, calculateOptimalThrottle, dismissRecommendation, clearRecommendations } = useAIOracle('pit');
  const { weather, getWeatherRiskLevel } = useWeather();

  const [expandedRec, setExpandedRec] = useState(null);

  const optimalThrottle = calculateOptimalThrottle();
  const weatherRisk = getWeatherRiskLevel();

  const getPriorityOrder = (priority) => {
    switch (priority) {
      case AI_PRIORITY.CRITICAL: return 0;
      case AI_PRIORITY.HIGH: return 1;
      case AI_PRIORITY.MEDIUM: return 2;
      case AI_PRIORITY.LOW: return 3;
      default: return 4;
    }
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp - a.timestamp;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case AI_CATEGORY.ENERGY:
        return <Zap className="w-4 h-4" />;
      case AI_CATEGORY.WEATHER:
        return <Droplets className="w-4 h-4" />;
      case AI_CATEGORY.STRATEGY:
        return <Brain className="w-4 h-4" />;
      case AI_CATEGORY.SAFETY:
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-3 border-b border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Brain className="w-2.5 h-2.5 text-primary" />
          <span className="text-[8px] font-mono tracking-widest text-white/30 uppercase">AI ORACLE · Intelligence Engine</span>
        </div>
        {recommendations.length > 0 && (
          <button
            onClick={clearRecommendations}
            className="text-[7px] font-mono text-white/40 hover:text-white/60 transition-colors"
          >
            CLEAR ALL
          </button>
        )}
      </div>

      {/* Energy Forecast Card */}
      {energyForecast && (
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-2.5 h-2.5" style={{ color: getAIColor(energyForecast.risk_level) }} />
            <span className="text-[7px] font-mono text-white/20 tracking-wider">ENERGY FORECAST</span>
            <span className={`ml-auto text-[7px] font-mono font-bold tracking-wider`} style={{ color: getAIColor(energyForecast.risk_level) }}>
              {energyForecast.risk_level}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <div className="text-[6px] font-mono text-white/20 uppercase">Burn Rate</div>
              <div className="text-sm font-display font-black" style={{ color: getAIColor(energyForecast.risk_level) }}>
                {energyForecast.burn_rate} Wh/h
              </div>
            </div>
            <div>
              <div className="text-[6px] font-mono text-white/20 uppercase">Projected</div>
              <div className="text-sm font-display font-black text-white/80">
                {energyForecast.projected_usage} Wh
              </div>
            </div>
            <div>
              <div className="text-[6px] font-mono text-white/20 uppercase">Remaining</div>
              <div className="text-sm font-display font-black text-white/80">
                {energyForecast.remaining_capacity} Wh
              </div>
            </div>
            <div>
              <div className="text-[6px] font-mono text-white/20 uppercase">Laps Left</div>
              <div className="text-sm font-display font-black text-white/80">
                {energyForecast.laps_remaining}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather-Adaptive Strategy Card */}
      <div className="rounded border border-white/[0.06] bg-white/[0.02] p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Wind className="w-2.5 h-2.5" style={{ color: getAIColor(weatherRisk === 'CRITICAL' ? 'CRITICAL' : weatherRisk === 'HIGH' ? 'HIGH' : 'LOW') }} />
          <span className="text-[7px] font-mono text-white/20 tracking-wider">WEATHER-ADAPTIVE STRATEGY</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[6px] font-mono text-white/20 uppercase">Optimal Throttle</div>
            <div className="text-lg font-display font-black" style={{ color: optimalThrottle < 0.8 ? '#FF1E42' : optimalThrottle < 0.9 ? '#FFB300' : '#10B981' }}>
              {(optimalThrottle * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-[6px] font-mono text-white/20 uppercase">Weather Risk</div>
            <div className="text-lg font-display font-black" style={{ color: getAIColor(weatherRisk === 'CRITICAL' ? 'CRITICAL' : weatherRisk === 'HIGH' ? 'HIGH' : 'LOW') }}>
              {weatherRisk}
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations List */}
      {sortedRecommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-[7px] font-mono text-white/30 uppercase tracking-wider mb-2">
            Tactical Recommendations ({sortedRecommendations.length})
          </div>
          {sortedRecommendations.slice(0, 5).map((rec) => {
            const color = getAIColor(rec.priority);
            const bgClass = getAIBackground(rec.priority);
            const isExpanded = expandedRec === rec.id;

            return (
              <div
                key={rec.id}
                className={`rounded border p-2.5 cursor-pointer transition-all ${bgClass}`}
                onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5" style={{ color }}>
                    {getCategoryIcon(rec.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[7px] font-mono font-bold tracking-wider uppercase" style={{ color }}>
                        {rec.category}
                      </span>
                      <span className={`text-[6px] font-mono px-1.5 py-0.5 rounded ${bgClass}`} style={{ color }}>
                        {rec.priority}
                      </span>
                      {rec.actionable && (
                        <CheckCircle className="w-2.5 h-2.5" style={{ color }} />
                      )}
                    </div>
                    <div className="text-[9px] font-display font-bold tracking-wide leading-tight" style={{ color }}>
                      {rec.message}
                    </div>
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-white/[0.1]">
                        <div className="grid grid-cols-2 gap-2 text-[7px] font-mono text-white/40">
                          <div>
                            <span className="text-white/20">Confidence:</span> {(rec.confidence * 100).toFixed(0)}%
                          </div>
                          <div>
                            <span className="text-white/20">Target:</span> {rec.target_value ? rec.target_value.toFixed(2) : 'N/A'}
                          </div>
                        </div>
                        {rec.context && Object.keys(rec.context).length > 0 && (
                          <div className="mt-1 text-[6px] font-mono text-white/30 break-all">
                            {JSON.stringify(rec.context).slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissRecommendation(rec.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white/40 hover:text-white/60" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Recommendations State */}
      {sortedRecommendations.length === 0 && (
        <div className="rounded border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <Brain className="w-6 h-6 mx-auto mb-2 text-white/20" />
          <div className="text-[8px] font-mono text-white/30 tracking-wider">NO ACTIVE RECOMMENDATIONS</div>
          <div className="text-[7px] font-mono text-white/20 mt-1">AI ORACLE monitoring telemetry...</div>
        </div>
      )}
    </div>
  );
}
