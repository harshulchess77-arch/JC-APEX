import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useWeather } from '@/lib/WeatherContext';

// AI Recommendation priority levels
export const AI_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

// AI Recommendation categories
export const AI_CATEGORY = {
  ENERGY: 'ENERGY',
  STRATEGY: 'STRATEGY',
  SAFETY: 'SAFETY',
  WEATHER: 'WEATHER',
};

// Color coding for F1 UI standards
export const getAIColor = (priority) => {
  switch (priority) {
    case AI_PRIORITY.CRITICAL:
      return '#FF1E42'; // Red - critical interventions
    case AI_PRIORITY.HIGH:
      return '#FFB300'; // Amber - strategic shifts
    case AI_PRIORITY.MEDIUM:
      return '#FFA500'; // Orange - advisory
    case AI_PRIORITY.LOW:
    default:
      return '#00E5FF'; // Cyan - advisory pacing
  }
};

export const getAIBackground = (priority) => {
  switch (priority) {
    case AI_PRIORITY.CRITICAL:
      return 'bg-[#FF1E42]/20 border-[#FF1E42]';
    case AI_PRIORITY.HIGH:
      return 'bg-[#FFB300]/20 border-[#FFB300]';
    case AI_PRIORITY.MEDIUM:
      return 'bg-[#FFA500]/20 border-[#FFA500]';
    case AI_PRIORITY.LOW:
    default:
      return 'bg-[#00E5FF]/20 border-[#00E5FF]';
  }
};

export function useAIOracle(role = 'pit') {
  const [recommendations, setRecommendations] = useState([]);
  const [energyForecast, setEnergyForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTableAvailable, setIsTableAvailable] = useState(true);

  const { weather } = useWeather();
  const channelRef = useRef(null);
  const telemetryHistoryRef = useRef([]);
  const MAX_HISTORY = 360; // 72 seconds at 5 Hz

  // Subscribe to AI recommendations from Supabase
  useEffect(() => {
    if (!supabase?.channel) return;

    const channelName = `ai_recommendations_${role}_${Date.now()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true, ack: true },
        presence: { key: role },
      },
    });

    channel
      .on('broadcast', { event: 'ai_recommendation' }, (payload) => {
        const data = payload?.payload || payload?.data || payload;
        if (data) {
          handleIncomingRecommendation(data);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_recommendations' }, (payload) => {
        if (payload.new) {
          handleIncomingRecommendation(payload.new);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV === 'development') {
            console.log('[AI ORACLE] Connected to recommendations channel');
          }
          channelRef.current = channel;
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [role]);

  const handleIncomingRecommendation = useCallback((data) => {
    // Defensive null-checks
    if (!data || !data.id) return;

    const normalized = {
      id: data.id,
      category: data.category || AI_CATEGORY.ENERGY,
      priority: data.priority || AI_PRIORITY.LOW,
      message: data.message || 'No message',
      actionable: data.actionable !== false,
      target_value: data.target_value,
      confidence: data.confidence || 0.0,
      context: data.context ? (typeof data.context === 'string' ? JSON.parse(data.context) : data.context) : {},
      timestamp: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    };

    setRecommendations(prev => {
      // Avoid duplicates by id
      if (prev.some(r => r.id === normalized.id)) return prev;
      // Keep only last 20 recommendations
      return [normalized, ...prev].slice(0, 20);
    });
  }, []);

  // Client-side energy forecasting (fallback if Python AI not available)
  const calculateEnergyForecast = useCallback((telemetry) => {
    if (!telemetry || telemetryHistoryRef.current.length < 10) {
      return null;
    }

    const history = telemetryHistoryRef.current;
    const recent = history.slice(-60); // Last 12 seconds at 5 Hz

    if (recent.length < 2) return null;

    const first = recent[0];
    const last = recent[recent.length - 1];
    const timeDelta = (last.timestamp - first.timestamp) / 1000; // Convert to seconds

    if (timeDelta <= 0) return null;

    const whDelta = last.wh - first.wh;
    const burnRate = (whDelta / timeDelta) * 3600; // Wh/hour

    const batteryCapacity = 3000; // Default 3 kWh
    const currentWh = telemetry.wh || 0;
    const remainingWh = batteryCapacity - currentWh;

    const hoursRemaining = burnRate > 0 ? remainingWh / burnRate : 999;
    const projectedUsage = burnRate * 1.0; // 1 hour race

    // Risk assessment
    let riskLevel = 'LOW';
    if (projectedUsage > batteryCapacity * 0.95) riskLevel = 'CRITICAL';
    else if (projectedUsage > batteryCapacity * 0.85) riskLevel = 'HIGH';
    else if (projectedUsage > batteryCapacity * 0.70) riskLevel = 'MEDIUM';

    return {
      burn_rate: Math.round(burnRate * 10) / 10,
      projected_usage: Math.round(projectedUsage * 10) / 10,
      remaining_capacity: Math.round(remainingWh * 10) / 10,
      hours_remaining: Math.round(hoursRemaining * 10) / 10,
      laps_remaining: Math.round(hoursRemaining * 3600 / 63 * 10) / 10, // 63s per lap
      risk_level: riskLevel,
    };
  }, []);

  // Process telemetry frame through client-side AI
  const processTelemetry = useCallback((telemetry) => {
    if (!telemetry) return;

    // Add to history
    telemetryHistoryRef.current.push({
      ...telemetry,
      timestamp: Date.now(),
    });

    // Trim history
    if (telemetryHistoryRef.current.length > MAX_HISTORY) {
      telemetryHistoryRef.current.shift();
    }

    // Calculate energy forecast
    const forecast = calculateEnergyForecast(telemetry);
    setEnergyForecast(forecast);

    // Generate client-side recommendations if needed
    if (forecast && forecast.risk_level === 'CRITICAL') {
      const rec = {
        id: `client_energy_${Date.now()}`,
        category: AI_CATEGORY.ENERGY,
        priority: AI_PRIORITY.CRITICAL,
        message: `CRITICAL ENERGY: Burn rate ${forecast.burn_rate} Wh/h. Remaining ${forecast.remaining_capacity} Wh.`,
        actionable: true,
        target_value: forecast.burn_rate,
        confidence: 0.65,
        context: { forecast },
        timestamp: Date.now(),
      };
      handleIncomingRecommendation(rec);
    }
  }, [calculateEnergyForecast, handleIncomingRecommendation]);

  // Weather-adaptive throttle calculation
  const calculateOptimalThrottle = useCallback(() => {
    if (!weather) return 1.0;

    const {
      ambientTemp,
      trackTemp,
      rainProbability,
      windSpeed,
      gripCoefficient,
    } = weather;

    let throttle = 1.0;

    // Rain penalty
    if (rainProbability > 60) throttle *= 0.75;
    else if (rainProbability > 30) throttle *= 0.85;

    // Grip penalty
    throttle *= gripCoefficient;

    // Temperature penalty
    if (trackTemp > 45) throttle *= 0.90;
    else if (trackTemp < 20) throttle *= 0.92;

    // Wind penalty
    if (windSpeed > 20) throttle *= 0.95;

    return Math.max(0.5, Math.min(1.0, throttle));
  }, [weather]);

  // Dismiss recommendation
  const dismissRecommendation = useCallback((id) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  }, []);

  // Clear all recommendations
  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
  }, []);

  return {
    recommendations,
    energyForecast,
    isLoading,
    error,
    processTelemetry,
    calculateOptimalThrottle,
    dismissRecommendation,
    clearRecommendations,
  };
}
