import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * AI Driving Oracle Hook
 * Fetches AI recommendations from Supabase oracle_recommendations table
 * Provides real-time updates via Supabase Realtime
 */

export const ORACLE_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export function useAIDrivingOracle(sessionId = null) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('oracle_recommendations')
        .select('*')
        .eq('session_id', sessionId || 'default')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (fetchError) throw fetchError;
      setRecommendations(data || []);
    } catch (err) {
      setError(err.message);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchRecommendations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('ai_oracle_recommendations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'oracle_recommendations',
        filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
      }, (payload) => {
        setRecommendations(prev => [payload.new, ...prev].slice(0, 10));
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    isConnected,
    fetchRecommendations,
  };
}
