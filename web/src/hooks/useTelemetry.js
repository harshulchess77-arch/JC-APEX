import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for listening to real-time hardware telemetry from Supabase
 * Connects to postgres_changes events on telemetry_logs table
 *
 * This hook is designed to be non-intrusive - it only provides data
 * and does not modify any UI components or styling
 */
const ZERO_TELEMETRY = {
  speed: 0.00,
  battery: 0,
  temp: 0,
  voltage: 0.00,
  current: 0.00,
  efficiency: 0,
  lap: 0,
  totalLaps: 0,
  raceTime: 0,
};

export function useTelemetry(sessionId = null, enabled = true) {
  const [hardwareData, setHardwareData] = useState(null);
  const [telemetry, setTelemetry] = useState(ZERO_TELEMETRY);
  const [strategy, setStrategy] = useState('balanced');
  const [flag, setFlag] = useState('green');
  const [oracleMessages, setOracleMessages] = useState([]);
  const [commsMessages, setCommsMessages] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [isLive, setIsLive] = useState(false);

  const formatTime = useCallback((seconds) => {
    const s = typeof seconds === 'number' ? seconds : 0;
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }, []);

  const sendCommand = useCallback((text) => {
    const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    setCommsMessages(prev => [...prev, { from: 'pit', text, time }]);
  }, []);

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

          const currentVal = Number(data.current || 0);
          setHardwareData({
            current: currentVal,
            rssi: data.rssi || 0,
            snr: data.snr || 0,
            packetId: data.packet_id,
            timestamp: data.created_at,
            sessionId: data.session_id,
          });

          // Live incoming hardware updates metrics from 0.00 baseline
          setTelemetry(prev => ({
            ...prev,
            current: currentVal,
            power: Math.round(currentVal * (prev.voltage || 48.0)),
          }));

          setActiveSessionId(data.session_id);
          const now = new Date();
          setLastUpdate(now);
          setIsConnected(true);
          setIsLive(true);

          // Update chartData with real hardware point
          const timeStr = now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
          setChartData(prev => {
            const next = [...prev, {
              time: timeStr,
              current: currentVal,
              speed: 0,
              battery: 0,
              temp: 0,
              voltage: 0,
              efficiency: 0,
            }];
            return next.length > 200 ? next.slice(-200) : next;
          });

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
  // When idle, drop isLive to false and ensure live current sits at 0.00.
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (!lastUpdate) {
        setIsLive(false);
        setTelemetry(prev => ({ ...prev, current: 0.00 }));
        return;
      }
      const alive = (Date.now() - lastUpdate.getTime()) < 3000;
      setIsLive(alive);
      if (!alive) {
        setTelemetry(prev => ({ ...prev, current: 0.00 }));
      }
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
    telemetry,
    strategy, setStrategy,
    flag, setFlag,
    oracleMessages,
    commsMessages,
    chartData,
    sendCommand,
    formatTime,
    estimatedLapsRemaining: 0,
    signalLost: !isLive,
    lastPacketTime: lastUpdate ? lastUpdate.getTime() : 0,
    targetPace: '0 MPH',
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
