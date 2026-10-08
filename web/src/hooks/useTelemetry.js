import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

/**
 * ============================================================================
 * JC-APEX HYBRID TELEMETRY HOOK
 * Seamlessly transitions between Live Hardware and Simulated Demo modes.
 * ============================================================================
 * - Live Hardware Mode (isDemoMode === false):
 *     * Listens exclusively to Supabase Realtime INSERT events on telemetry_logs table
 *     * 3000ms Zero-Baseline Watchdog: If no hardware packets arrive within 3 seconds,
 *       all UI metrics (Amps, Volts, Speed, Watts, Hall Speed, GPS Speed) drop to 0.00
 * - Simulation / Demo Mode (isDemoMode === true):
 *     * Disconnects / ignores Supabase Realtime
 *     * Runs high-frequency 5 Hz (200ms) local generator with realistic 48V Electrothon ranges:
 *         - Voltage: 46V - 53V
 *         - Amps: 10A - 60A
 *         - Speed: 15 - 30 MPH
 *         - Watts: Amps * Volts
 * ============================================================================
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
  totalLaps: 30,
  raceTime: 0,
};

export function useTelemetry(sessionId = null, enabled = true, options = {}) {
  // Determine if Demo Mode is active from PasscodeAuthContext
  let authIsDemoMode = false;
  try {
    const auth = usePasscodeAuth();
    authIsDemoMode = Boolean(auth?.isDemoMode);
  } catch (err) {
    // Silently default to false if not in auth context
    console.debug('[useTelemetry] Not in PasscodeAuthContext, defaulting to isDemoMode=false');
  }
  
  // Allow explicit override via options, otherwise use auth context
  const isDemoMode = options.isDemoMode !== undefined 
    ? Boolean(options.isDemoMode) 
    : authIsDemoMode;

  const [hardwareData, setHardwareData] = useState(null);
  const [telemetry, setTelemetry] = useState(ZERO_TELEMETRY);
  const [strategy, setStrategy] = useState('balanced');
  const [flag, setFlag] = useState('green');
  const [oracleMessages, setOracleMessages] = useState([
    { text: 'System initialized. All telemetry nominal.', severity: 'nominal', time: '00:00', id: 0 },
    { text: 'Oracle Core v2 online. Monitoring 48V powertrain.', severity: 'nominal', time: '00:01', id: 1 },
  ]);
  const [commsMessages, setCommsMessages] = useState([
    { from: 'system', text: 'Telemetry stream established.', time: '00:00' },
  ]);
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [isLive, setIsLive] = useState(false);

  const demoTickRef = useRef(0);
  const oracleMsgIdRef = useRef(2);

  const formatTime = useCallback((seconds) => {
    const s = typeof seconds === 'number' ? seconds : 0;
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }, []);

  const sendCommand = useCallback((text) => {
    const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    setCommsMessages(prev => [...prev, { from: 'pit', text, time }]);
    setTimeout(() => {
      setCommsMessages(prev => [...prev, { from: 'driver', text: `ACK: ${text}`, time }]);
    }, 600);
  }, []);

  // ============================================================================
  // 1. SIMULATION / DEMO MODE (isDemoMode === true)
  // ============================================================================
  useEffect(() => {
    if (!enabled || !isDemoMode) {
      return;
    }

    setActiveSessionId('DEMO-SIM-48V');
    setIsConnected(true);
    setIsLive(true);

    // Initial seed for demo mode
    const initVolts = 49.8;
    const initAmps = 28.5;
    const initSpeed = 23.4;
    const initPower = Math.round(initVolts * initAmps);

    setTelemetry(prev => ({
      ...prev,
      voltage: initVolts,
      current: initAmps,
      power: initPower,
      speed: initSpeed,
      speed_hall: initSpeed,
      speed_gps: initSpeed + 0.1,
      battery: 82,
      temp: 41.2,
      efficiency: 84,
      lap: prev.lap || 3.4,
      totalLaps: 30,
      raceTime: prev.raceTime || 142,
    }));

    // 5 Hz Loop (200ms update rate)
    const demoInterval = setInterval(() => {
      demoTickRef.current += 1;
      const t = demoTickRef.current;

      // Realistic 48V Electrothon Simulation Ranges:
      // Voltage: 46V - 53V
      const rawVolts = 49.5 + Math.sin(t * 0.04) * 2.8 + (Math.random() - 0.5) * 0.3;
      const mockVolts = Math.max(46.0, Math.min(53.0, Math.round(rawVolts * 100) / 100));

      // Amps: 10A - 60A
      const stratMultiplier = strategy === 'aggressive' ? 1.3 : strategy === 'conserve' ? 0.7 : 1.0;
      const rawAmps = (30.0 + Math.sin(t * 0.07) * 18.0 + (Math.random() - 0.5) * 3.0) * stratMultiplier;
      const mockAmps = Math.max(10.0, Math.min(60.0, Math.round(rawAmps * 100) / 100));

      // Speed: 15 - 30 MPH
      const rawSpeed = (22.5 + Math.sin(t * 0.05) * 6.5 + (Math.random() - 0.5) * 0.6) * (flag === 'yellow' ? 0.6 : flag === 'red' ? 0 : 1.0);
      const mockSpeed = Math.max(flag === 'red' ? 0 : 15.0, Math.min(30.0, Math.round(rawSpeed * 100) / 100));

      // Watts: Amps * Volts
      const mockWatts = Math.round(mockVolts * mockAmps * 100) / 100;

      // Speed Hall & GPS
      const mockSpeedHall = mockSpeed;
      const mockSpeedGps = mockSpeed > 0 ? Math.round((mockSpeed + (Math.sin(t * 0.2) * 0.25)) * 100) / 100 : 0.00;

      // Battery percentage derived from 48V Li-ion pack (42.0V empty -> 54.6V full)
      const mockBattery = Math.max(0, Math.min(100, Math.round(((mockVolts - 42.0) / (54.6 - 42.0)) * 100)));

      // Motor Temperature: 38°C - 48°C
      const mockTemp = Math.round((39.0 + Math.sin(t * 0.02) * 4.5 + (mockAmps > 45 ? 2.0 : 0)) * 10) / 10;

      // Geolocation track loop
      const mockLat = 34.0200 + Math.sin(t * 0.02) * 0.0025;
      const mockLng = -84.1900 + Math.cos(t * 0.02) * 0.0035;

      const now = new Date();
      setLastUpdate(now);

      const packetRecord = {
        packet_id: t,
        id: t,
        current: mockAmps,
        amps: mockAmps,
        voltage: mockVolts,
        volts: mockVolts,
        power: mockWatts,
        watts: mockWatts,
        speed: mockSpeed,
        speed_hall: mockSpeedHall,
        speed_gps: mockSpeedGps,
        latitude: mockLat,
        longitude: mockLng,
        battery: mockBattery,
        temp: mockTemp,
        rssi: -58 + Math.floor(Math.sin(t * 0.1) * 4),
        snr: 9.8,
        session_id: 'DEMO-SIM-48V',
        created_at: now.toISOString(),
      };

      setHardwareData(packetRecord);

      setTelemetry(prev => ({
        ...prev,
        current: mockAmps,
        voltage: mockVolts,
        power: mockWatts,
        speed: mockSpeed,
        speed_hall: mockSpeedHall,
        speed_gps: mockSpeedGps,
        battery: mockBattery,
        temp: mockTemp,
        efficiency: mockSpeed > 0 ? Math.min(96, Math.max(68, Math.round(76 + (mockSpeed / 30.0) * 14))) : 0,
        latitude: mockLat,
        longitude: mockLng,
        lap: prev.lap + (mockSpeed / (0.25 * 3600 * 5)),
        totalLaps: 30,
        raceTime: prev.raceTime + (t % 5 === 0 ? 1 : 0),
      }));

      // Accumulate Chart Data every 1 second (every 5 ticks at 5 Hz)
      if (t % 5 === 0) {
        const timeStr = now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        setChartData(prev => {
          const next = [...prev, {
            time: timeStr,
            current: mockAmps,
            voltage: mockVolts,
            power: mockWatts,
            speed: mockSpeed,
            speed_hall: mockSpeedHall,
            speed_gps: mockSpeedGps,
            battery: mockBattery,
            temp: mockTemp,
            efficiency: mockSpeed > 0 ? Math.min(96, Math.max(68, Math.round(76 + (mockSpeed / 30.0) * 14))) : 0,
          }];
          return next.length > 200 ? next.slice(-200) : next;
        });

        // Keep history buffer capped at 200 for PDF export
        setTelemetryHistory(prev => {
          const next = [...prev, packetRecord];
          return next.length > 200 ? next.slice(-200) : next;
        });
      }

      // Generate periodic strategic Oracle notifications in demo mode
      if (t % 50 === 0) {
        oracleMsgIdRef.current += 1;
        const msgs = [
          '48V tractive system operating in peak efficiency zone (85%).',
          'Motor thermal rise nominal: +0.2°C/min. Push window open.',
          'LoRa telemetry link robust: -58 dBm, SNR 9.8 dB.',
          'Pace target holding steady. Projected range: +14 laps margin.',
        ];
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        setOracleMessages(prev => [
          { text: randomMsg, severity: 'nominal', time: now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), id: oracleMsgIdRef.current },
          ...prev.slice(0, 8),
        ]);
      }
    }, 200);

    return () => clearInterval(demoInterval);
  }, [enabled, isDemoMode, strategy, flag]);

  // ============================================================================
  // 2. LIVE HARDWARE MODE (isDemoMode === false)
  // ============================================================================
  useEffect(() => {
    // If Demo Mode is active or hook disabled, DO NOT subscribe to Supabase Realtime
    if (!enabled || isDemoMode) {
      return;
    }

    // Initialize to zero baseline when starting Live Hardware Mode
    setTelemetry(ZERO_TELEMETRY);
    setIsLive(false);

    // Subscribe to Supabase Realtime postgres_changes on telemetry_logs
    const channel = supabase
      .channel('live-hardware-telemetry')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_logs',
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        (payload) => {
          console.log('[useTelemetry] Received payload:', payload);
          const data = payload.new;

          // Parse live hardware fields with defensive numeric fallbacks
          // Support both legacy (current, voltage, power, speed_hall, speed_gps) and new (amps, volts, watts, speed_h, speed_g) field names
          const currentVal = Number(data?.amps ?? data?.current ?? 0);
          const voltageVal = Number(data?.volts ?? data?.voltage ?? 0);
          const powerVal = Number(
            data?.watts ?? data?.power ?? (currentVal * voltageVal)
          );
          const speedHallVal = Number(data?.speed_h ?? data?.speed_hall ?? 0);
          const speedGpsVal = Number(data?.speed_g ?? data?.speed_gps ?? 0);
          // Live vehicle speed: prefer Hall sensor, fall back to GPS speed
          const speedVal = speedHallVal > 0 ? speedHallVal : speedGpsVal;
          const latVal = Number(data?.latitude ?? data?.lat ?? 0);
          const lngVal = Number(data?.longitude ?? data?.lng ?? 0);
          const rssiVal = Number(data?.rssi ?? -80);
          const snrVal = Number(data?.snr ?? 0);

          // 48V Li-ion pack estimation: ~42.0V (0%) to ~54.6V (100%)
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
            rssi: rssiVal,
            snr: snrVal,
            packetId: data?.packet_id ?? data?.id,
            timestamp: data?.created_at,
            sessionId: data?.session_id,
          });

          // Live incoming hardware updates metrics from baseline
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

          setActiveSessionId(data?.session_id);
          const now = new Date();
          setLastUpdate(now);
          setIsConnected(true);
          setIsLive(true);

          // Update chartData with live hardware point
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

          // Cap telemetry history
          setTelemetryHistory(prev => {
            const newHistory = [...prev, data];
            return newHistory.length > 200 ? newHistory.slice(-200) : newHistory;
          });
        }
      )
      .subscribe((status) => {
        console.log('[useTelemetry] Supabase Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[useTelemetry] Successfully subscribed to telemetry_logs table');
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('[useTelemetry] Subscription closed or error:', status);
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, isDemoMode, sessionId]);

  // ============================================================================
  // 3. ZERO-BASELINE 3000ms SAFEGUARD WATCHDOG (LIVE HARDWARE MODE ONLY)
  // If no hardware packets arrive within 3 seconds, drop UI metrics to 0.00
  // ============================================================================
  useEffect(() => {
    if (isDemoMode) {
      return; // Do not drop metrics in Demo Mode
    }

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

      const elapsed = Date.now() - lastUpdate.getTime();
      const alive = elapsed < 3000;
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
  }, [lastUpdate, isDemoMode]);

  // Helper Alerts for dashboard compatibility
  const thermalAlert = useMemo(() => ({
    level: telemetry.temp > 58 ? 'critical' : telemetry.temp > 46 ? 'warning' : 'nominal',
    color: telemetry.temp > 58 ? '#FF1E42' : telemetry.temp > 46 ? '#FFB300' : '#10B981',
    flashing: telemetry.temp > 58,
  }), [telemetry.temp]);

  const voltageAlert = useMemo(() => ({
    level: (telemetry.voltage < 42.0 && telemetry.voltage > 0) ? 'critical' : (telemetry.voltage < 45.0 && telemetry.voltage > 0) ? 'warning' : 'nominal',
    color: (telemetry.voltage < 42.0 && telemetry.voltage > 0) ? '#FF1E42' : (telemetry.voltage < 45.0 && telemetry.voltage > 0) ? '#FFB300' : '#10B981',
    flashing: (telemetry.voltage < 42.0 && telemetry.voltage > 0),
  }), [telemetry.voltage]);

  // Historical Session Helpers
  const fetchSessionData = useCallback(async (sessionIdParam, limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .eq('session_id', sessionIdParam)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching session data:', error);
      return [];
    }
  }, []);

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

  const fetchAvailableSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionMap = new Map();
      (data || []).forEach(record => {
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
    targetPace: { label: '25 MPH', zone: 'green', color: '#00FF66' },
    power: telemetry?.power ?? Math.round((telemetry?.current ?? 0) * (telemetry?.voltage ?? 0)),
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
    isMock: isDemoMode,
    isDemoMode,
  };
}
