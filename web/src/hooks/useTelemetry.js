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
  const [isLive, setIsLive] = useState(false);

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
          setIsLive(true);

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

  // Watchdog: isLive = true only while packets arrive within last 3000ms.
  // Runs on a 1-second interval so isLive drops promptly when hardware goes idle.
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (!lastUpdate) {
        setIsLive(false);
        return;
      }
      setIsLive((Date.now() - lastUpdate.getTime()) < 3000);
    }, 1000);
    return () => clearInterval(watchdog);
  }, [lastUpdate]);

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

  // Function to fetch available sessions for session selector
  const fetchAvailableSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique session IDs with their latest timestamp
      const sessionMap = new Map();
      data.forEach(record => {
        if (!sessionMap.has(record.session_id)) {
          sessionMap.set(record.session_id, record.created_at);
        }
      });

      // Convert to array and sort by timestamp descending
      const sessions = Array.from(sessionMap.entries())
        .map(([sessionId, createdAt]) => ({ sessionId, createdAt }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return sessions;
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      return [];
    }
  }, []);

  return {
    hardwareData,
    isConnected,
    isLive,
    sessionId: activeSessionId,
    lastUpdate,
    telemetryHistory,
    fetchSessionData,
    fetchSessionMetrics,
    fetchAvailableSessions,
    isMock: false,
  };
}
