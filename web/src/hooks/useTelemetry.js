import { useState, useCallback } from 'react';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';
import { ZERO_TELEMETRY } from './telemetry/telemetry-constants';
import { useDemoTelemetry } from './telemetry/telemetry-demo';
import { useLiveTelemetry } from './telemetry/telemetry-live';
import { useTelemetryWatchdog } from './telemetry/telemetry-watchdog';
import { useTelemetryAlerts, useSessionData } from './telemetry/telemetry-utils';

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

  // Demo mode telemetry simulation
  useDemoTelemetry({
    enabled: enabled && isDemoMode,
    strategy,
    flag,
    setTelemetry,
    setHardwareData,
    setChartData,
    setTelemetryHistory,
    setLastUpdate,
    setOracleMessages,
  });

  // Live hardware telemetry
  useLiveTelemetry({
    enabled: enabled && !isDemoMode,
    sessionId,
    setTelemetry,
    setHardwareData,
    setChartData,
    setTelemetryHistory,
    setLastUpdate,
    setIsConnected,
    setIsLive,
    setActiveSessionId,
  });

  // Zero-baseline watchdog for live mode
  useTelemetryWatchdog({
    isDemoMode,
    lastUpdate,
    setTelemetry,
    setIsLive,
  });

  // Helper alerts
  const { thermalAlert, voltageAlert } = useTelemetryAlerts(telemetry);

  // Session data utilities
  const { fetchSessionData, fetchSessionMetrics, fetchAvailableSessions } = useSessionData();

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
    gpsFix: telemetry?.gpsFix ?? false,
    sats: telemetry?.sats ?? 0,
  };
}
