import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for listening to real-time hardware telemetry from Supabase
 * Connects to postgres_changes events on telemetry_logs table
 *
 * Designed for Electrothon 48V tractive system, motor Hall speed, and GPS metrics.
 * Non-intrusive - provides data and zero-baseline watchdog.
 */
const ZERO_TELEMETRY = {
  speed: 0.00,
  speed_hall: 0.00,
  speed_gps: 0.00,
  battery: 0,
  temp: 0,
  voltage: 0.00,
  current: 0.00,
  power: 0.00,
  latitude: 0.00,
  longitude: 0.00,
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

    // Subscribe to Supabase Realtime postgres_changes on telemetry_logs
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

          // Parse expanded 48V, speed and GPS fields with defensive fallbacks
          const currentVal = Number(data.current != null ? data.current : (data.amps != null ? data.amps : 0));
          const voltageVal = Number(data.voltage != null ? data.voltage : (data.volts != null ? data.volts : 0));
          const powerVal = Number(
            data.power != null
              ? data.power
              : (data.watts != null ? data.watts : (currentVal * voltageVal))
          );
          const speedHallVal = Number(data.speed_hall != null ? data.speed_hall : (data.speed_h != null ? data.speed_h : 0));
          const speedGpsVal = Number(data.speed_gps != null ? data.speed_gps : (data.speed_g != null ? data.speed_g : 0));
          // Live vehicle speed: prefer Hall sensor, fall back to GPS speed
          const speedVal = speedHallVal > 0 ? speedHallVal : speedGpsVal;
          const latVal = Number(data.latitude != null ? data.latitude : (data.lat != null ? data.lat : 0));
          const lngVal = Number(data.longitude != null ? data.longitude : (data.lng != null ? data.lng : 0));

          // Calculate estimated battery percentage from 48V pack
          // 48V Li-ion pack: ~42.0V (0% empty) to ~54.6V (100% full)
          let batteryPct = 0;
          if (voltageVal > 30.0) {
            batteryPct = Math.max(0, Math.min(100, Math.round(((voltageVal - 42.0) / (54.6 - 42.0)) * 100)));
          }

          setHardwareData({
            current: currentVal,
            voltage: voltageVal,
            power: powerVal,
            speedHall: speedHallVal,
            speedGps: speedGpsVal,
            speed: speedVal,
            latitude: latVal,
            longitude: lngVal,
            rssi: data.rssi || 0,
            snr: data.snr || 0,
            packetId: data.packet_id || data.id,
            timestamp: data.created_at,
            sessionId: data.session_id,
          });

          // Live incoming hardware updates metrics from 0.00 baseline
          setTelemetry(prev => ({
            ...prev,
            current: currentVal,
            voltage: voltageVal,
            power: powerVal,
            speed: speedVal,
            speed_hall: speedHallVal,
            speed_gps: speedGpsVal,
            latitude: latVal,
            longitude: lngVal,
            battery: batteryPct > 0 ? batteryPct : (voltageVal === 0 ? 0 : prev.battery),
            efficiency: speedVal > 0 ? Math.min(100, Math.round((speedVal / 35.0) * 100)) : 0,
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
              voltage: voltageVal,
              power: powerVal,
              speed: speedVal,
              speed_hall: speedHallVal,
              speed_gps: speedGpsVal,
              battery: batteryPct,
              temp: 0,
              efficiency: speedVal > 0 ? Math.min(100, Math.round((speedVal / 35.0) * 100)) : 0,
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

  // Zero-Baseline Safeguard Watchdog:
  // If the hardware disconnects (no packets for >3000ms), gracefully drop UI live metrics
  // (Amps, Volts, Watts, Speed) to 0.00 to prevent displaying frozen/stale data during a vehicle fault.
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (!lastUpdate) {
        setIsLive(false);
        setTelemetry(prev => ({
          ...prev,
          current: 0.00,
          voltage: 0.00,
          power: 0.00,
          speed: 0.00,
          speed_hall: 0.00,
          speed_gps: 0.00,
        }));
        return;
      }
      const alive = (Date.now() - lastUpdate.getTime()) < 3000;
      setIsLive(alive);
      if (!alive) {
        setTelemetry(prev => ({
          ...prev,
          current: 0.00,
          voltage: 0.00,
          power: 0.00,
          speed: 0.00,
          speed_hall: 0.00,
          speed_gps: 0.00,
        }));
      }
    }, 1000);
    return () => clearInterval(watchdog);
  }, [lastUpdate]);

  // Helper Alerts for dashboard compatibility
  const thermalAlert = useMemo(() => ({
    level: telemetry.temp > 58 ? 'critical' : telemetry.temp > 46 ? 'warning' : 'nominal',
    color: telemetry.temp > 58 ? '#ef4444' : telemetry.temp > 46 ? '#eab308' : '#22c55e',
    flashing: telemetry.temp > 58,
  }), [telemetry.temp]);

  const voltageAlert = useMemo(() => ({
    level: (telemetry.voltage < 42.0 && telemetry.voltage > 0) ? 'critical' : (telemetry.voltage < 45.0 && telemetry.voltage > 0) ? 'warning' : 'nominal',
    color: (telemetry.voltage < 42.0 && telemetry.voltage > 0) ? '#ef4444' : (telemetry.voltage < 45.0 && telemetry.voltage > 0) ? '#eab308' : '#60a5fa',
    flashing: (telemetry.voltage < 42.0 && telemetry.voltage > 0),
  }), [telemetry.voltage]);

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

      const sessionMap = new Map();
      data.forEach(record => {
        if (!sessionMap.has(record.session_id)) {
          sessionMap.set(record.session_id, record.created_at);
        }
      });

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
    targetPace: { label: '25 MPH', zone: 'green', color: '#22c55e' },
    power: telemetry.power || Math.round(telemetry.current * telemetry.voltage),
    thermalAlert,
    voltageAlert,
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
