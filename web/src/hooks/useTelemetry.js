import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for listening to real-time hardware telemetry from Supabase
 * Connects to postgres_changes events on telemetry_logs table
 *
 * This hook is designed to be non-intrusive - it only provides data
 * and does not modify any UI components or styling
 */
export function useTelemetry(sessionId = null, enabled = true) {
  const [hardwareData, setHardwareData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Subscribe to Supabase Realtime postgres_changes
    const channel = supabase
      .channel('live-telemetry')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_logs',
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        (payload) => {
          const data = payload.new;

          setHardwareData({
            current: data.current || 0,
            rssi: data.rssi || 0,
            snr: data.snr || 0,
            packetId: data.packet_id,
            timestamp: data.created_at,
            sessionId: data.session_id,
          });

          setActiveSessionId(data.session_id);
          setLastUpdate(new Date());
          setIsConnected(true);

          // Cap telemetry history to latest 200 points
          setTelemetryHistory(prev => {
            const newHistory = [...prev, data];
            return newHistory.length > 200 ? newHistory.slice(-200) : newHistory;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Hardware telemetry realtime connected');
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('Hardware telemetry realtime disconnected');
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, sessionId]);

  // Function to fetch latest session data (for historical charts)
  const fetchSessionData = useCallback(async (sessionIdParam, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .eq('session_id', sessionIdParam)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching session data:', error);
      return [];
    }
  }, []);

  // Function to get session metrics for PDF export
  const fetchSessionMetrics = useCallback(async (sessionIdParam) => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_session_metrics', { session_id_param: sessionIdParam });

      if (error) throw error;

      return data[0] || null;
    } catch (error) {
      console.error('Error fetching session metrics:', error);
      return null;
    }
  }, []);

  return {
    hardwareData,
    isConnected,
    sessionId: activeSessionId,
    lastUpdate,
    telemetryHistory,
    fetchSessionData,
    fetchSessionMetrics,
  };
}
