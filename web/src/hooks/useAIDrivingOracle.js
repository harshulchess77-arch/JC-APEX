/**
 * ============================================================================
 * JC-APEX AI DRIVING ORACLE REACTIVE HOOK
 * ============================================================================
 * Client-side AI ORACLE integration for real-time race strategy:
 * - Real-Time Energy Pacing
 * - Weather-Adaptive Strategy
 * - Oval Track Sector Analysis
 * 
 * COLOR CODING:
 * - Cyan (#00FFFF): Advisory pacing recommendations
 * - Amber (#FFB300): Strategic shifts
 * - Red (#FF0033): Critical safety/energy interventions
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ORACLE_SEVERITY = {
  NOMINAL: 'nominal',
  ADVISORY: 'advisory',
  STRATEGIC: 'strategic',
  CRITICAL: 'critical'
};

const ORACLE_COLORS = {
  [ORACLE_SEVERITY.NOMINAL]: {
    bg: 'bg-[#00FFFF]/10',
    border: 'border-[#00FFFF]',
    text: 'text-[#00FFFF]',
    badge: 'bg-[#00FFFF] text-black'
  },
  [ORACLE_SEVERITY.ADVISORY]: {
    bg: 'bg-[#00FFFF]/20',
    border: 'border-[#00FFFF]',
    text: 'text-[#00FFFF]',
    badge: 'bg-[#00FFFF] text-black'
  },
  [ORACLE_SEVERITY.STRATEGIC]: {
    bg: 'bg-[#FFB300]/20',
    border: 'border-[#FFB300]',
    text: 'text-[#FFB300]',
    badge: 'bg-[#FFB300] text-black'
  },
  [ORACLE_SEVERITY.CRITICAL]: {
    bg: 'bg-[#FF0033]/20',
    border: 'border-[#FF0033]',
    text: 'text-[#FF0033]',
    badge: 'bg-[#FF0033] text-white'
  }
};

/**
 * AI ORACLE Hook for client-side real-time strategy
 */
export function useAIDrivingOracle(sessionId = 'race-session-48v', enabled = true) {
  const [recommendations, setRecommendations] = useState([]);
  const [latestRecommendation, setLatestRecommendation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [weatherContext, setWeatherContext] = useState({
    ambient_temp: 25.0,
    track_temp: 30.0,
    rainfall_prob: 0.0,
    wind_speed: 0.0,
    wind_direction: 0.0,
    grip_coefficient: 1.0
  });
  
  const channelRef = useRef(null);
  const historyMaxLen = 50;

  // Fetch historical recommendations on mount
  useEffect(() => {
    if (!enabled || !supabase) return;

    const fetchRecommendations = async () => {
      try {
        const { data, error } = await supabase
          .from('oracle_recommendations')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(historyMaxLen);

        if (error) {
          console.debug('[AI ORACLE] Fetch error:', error.message);
          return;
        }

        if (data) {
          setRecommendations(data);
          if (data.length > 0) {
            setLatestRecommendation(data[0]);
          }
        }
      } catch (err) {
        console.debug('[AI ORACLE] Fetch exception:', err);
      }
    };

    fetchRecommendations();
  }, [sessionId, enabled]);

  // Subscribe to Realtime broadcast for live recommendations
  useEffect(() => {
    if (!enabled || !supabase) return;

    const channel = supabase.channel('ai_oracle_broadcast', {
      config: {
        broadcast: { self: true, ack: true },
      },
    });

    channel
      .on('broadcast', { event: 'oracle_recommendation' }, (payload) => {
        const rec = payload?.payload || payload?.data || payload;
        if (rec) {
          setLatestRecommendation(rec);
          setRecommendations(prev => {
            const updated = [rec, ...prev].slice(0, historyMaxLen);
            return updated;
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('[AI ORACLE] Realtime connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.log('[AI ORACLE] Realtime disconnected');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [sessionId, enabled]);

  // Update weather context
  const updateWeather = useCallback((weather) => {
    setWeatherContext(prev => ({ ...prev, ...weather }));
  }, []);

  // Get color scheme for severity
  const getSeverityColors = useCallback((severity) => {
    return ORACLE_COLORS[severity] || ORACLE_COLORS[ORACLE_SEVERITY.NOMINAL];
  }, []);

  // Clear recommendations
  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setLatestRecommendation(null);
  }, []);

  return {
    recommendations,
    latestRecommendation,
    isConnected,
    weatherContext,
    updateWeather,
    getSeverityColors,
    clearRecommendationss: clearRecommendations,
    ORACLE_SEVERITY
  };
}

/**
 * Client-side Energy Pacing Calculator (fallback if server-side ORACLE unavailable)
 */
export function useClientSideEnergyPacing(telemetry, batteryCapacityWh = 3000.0) {
  const [energyForecast, setEnergyForecast] = useState({
    currentEnergyPct: 0,
    depletionRate: 0,
    remainingTimeMin: 0,
    targetPower: 0,
    recommendation: null
  });

  useEffect(() => {
    if (!telemetry) return;

    const volts = telemetry.volts || 48.0;
    const amps = telemetry.amps || 20.0;
    const watts = telemetry.watts || (volts * amps);
    const wh = telemetry.wh || 0;
    const speed = telemetry.speed || 0;

    // Calculate energy percentage
    const energyPct = (wh / batteryCapacityWh) * 100;

    // Calculate depletion rate (Wh/s)
    const depletionRate = watts / 3600.0;

    // Calculate remaining time
    const remainingEnergy = Math.max(0, batteryCapacityWh - wh);
    const remainingTimeSec = depletionRate > 0.1 ? remainingEnergy / depletionRate : Infinity;
    const remainingTimeMin = remainingTimeSec / 60.0;

    // Calculate target power
    let targetPower = 500.0;
    if (remainingTimeMin > 60) {
      targetPower = 1000.0;
    } else if (remainingTimeMin > 45) {
      targetPower = 800.0;
    } else if (remainingTimeMin > 30) {
      targetPower = 600.0;
    } else if (remainingTimeMin > 15) {
      targetPower = 400.0;
    } else {
      targetPower = 300.0;
    }

    // Generate recommendation
    let recommendation = null;
    if (energyPct > 90) {
      recommendation = null;
    } else if (energyPct > 75) {
      recommendation = {
        message: 'ENERGY NOMINAL - MODERATE THROTTLE',
        severity: ORACLE_SEVERITY.ADVISORY
      };
    } else if (energyPct > 50) {
      const powerDelta = watts - targetPower;
      if (powerDelta > 100) {
        recommendation = {
          message: `SAVE ENERGY -${Math.round(powerDelta)}W TARGET`,
          severity: ORACLE_SEVERITY.STRATEGIC
        };
      }
    } else if (energyPct > 25) {
      recommendation = {
        message: 'BOX THIS LAP - ENERGY CRITICAL',
        severity: ORACLE_SEVERITY.CRITICAL
      };
    } else {
      recommendation = {
        message: 'EMERGENCY - BATTERY DEPLETED',
        severity: ORACLE_SEVERITY.CRITICAL
      };
    }

    setEnergyForecast({
      currentEnergyPct: energyPct,
      depletionRate,
      remainingTimeMin: Math.min(remainingTimeMin, 999),
      targetPower,
      recommendation
    });
  }, [telemetry, batteryCapacityWh]);

  return energyForecast;
}

export { ORACLE_SEVERITY, ORACLE_COLORS };
