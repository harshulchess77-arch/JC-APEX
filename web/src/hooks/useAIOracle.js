import { useState, useCallback } from 'react';

/**
 * AI Oracle Hook
 * Provides AI recommendations and strategy insights
 * NOTE: This is a minimal implementation to support AIRecommendationOverlay
 * Logic can be expanded to integrate with Supabase oracle_recommendations table
 */

export const AI_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const AI_CATEGORY = {
  ENERGY: 'ENERGY',
  STRATEGY: 'STRATEGY',
  SAFETY: 'SAFETY',
  WEATHER: 'WEATHER',
};

export function getAIColor(severity) {
  switch (severity) {
    case AI_PRIORITY.CRITICAL:
      return '#FF1E42';
    case AI_PRIORITY.HIGH:
      return '#FFB300';
    case AI_PRIORITY.MEDIUM:
      return '#00E5FF';
    default:
      return '#10B981';
  }
}

export function getAIBackground(severity) {
  switch (severity) {
    case AI_PRIORITY.CRITICAL:
      return 'rgba(255, 30, 66, 0.1)';
    case AI_PRIORITY.HIGH:
      return 'rgba(255, 179, 0, 0.1)';
    case AI_PRIORITY.MEDIUM:
      return 'rgba(0, 229, 255, 0.1)';
    default:
      return 'rgba(16, 185, 129, 0.1)';
  }
}

export function useAIOracle(sessionId = null) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Integrate with Supabase oracle_recommendations table
      // const { data, error } = await supabase
      //   .from('oracle_recommendations')
      //   .select('*')
      //   .eq('session_id', sessionId)
      //   .order('created_at', { ascending: false });
      
      // For now, return empty array
      setRecommendations([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
  };
}
