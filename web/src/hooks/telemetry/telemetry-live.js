import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { telemetryService } from '@/services/telemetryService';
import { logger } from '@/utils/logger';
import { ZERO_TELEMETRY } from './telemetry-constants';

export function useLiveTelemetry({ enabled, sessionId, setTelemetry, setHardwareData, setChartData, setTelemetryHistory, setLastUpdate, setIsConnected, setIsLive, setActiveSessionId }) {
  useEffect(() => {
    // If hook disabled, DO NOT subscribe to Supabase Realtime
    if (!enabled) {
      return;
    }

    // Initialize to zero baseline when starting Live Hardware Mode
    setTelemetry(ZERO_TELEMETRY);
    setIsLive(false);

    // Subscribe to Supabase Realtime postgres_changes on telemetry_logs
    // Use unique channel name per instance to avoid collisions
    const channelName = `live-hardware-telemetry-${sessionId || 'all'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_logs',
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        (payload) => {
          logger.log('[useTelemetry] Received payload:', payload);
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
          const satsVal = Number(data?.sats ?? 0);
          const rssiVal = Number(data?.rssi ?? -80);
          const snrVal = Number(data?.snr ?? 0);
          const gpsFix = latVal !== 0 && lngVal !== 0 && Math.abs(latVal) <= 90 && Math.abs(lngVal) <= 180 && satsVal >= 4;

          // 48V Li-ion pack estimation: ~42.0V (0%) to ~54.6V (100%)
          const batteryPct = telemetryService.calculateBatteryPercentage(voltageVal);

          setHardwareData({
            current: currentVal,
            voltage: voltageVal,
            power: powerVal,
            speedHall: speedHallVal,
            speedGps: speedGpsVal,
            speed: speedVal,
            latitude: latVal,
            longitude: lngVal,
            sats: satsVal,
            gpsFix: gpsFix,
            rssi: rssiVal,
            snr: snrVal,
            packetId: data?.packet_id ?? data?.id,
            timestamp: data?.created_at,
            sessionId: data?.session_id,
          });

          // Live incoming hardware updates metrics from baseline
          // Note: lap, temp, raceTime are not available from hardware - show null for "--" display
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
            gpsFix: gpsFix,
            sats: satsVal,
            battery: batteryPct > 0 ? batteryPct : (voltageVal === 0 ? 0 : prev.battery),
            efficiency: telemetryService.calculateEfficiency(speedVal),
            temp: null, // Not from hardware
            lap: null,  // Not from hardware
            raceTime: null, // Not from hardware
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
              efficiency: telemetryService.calculateEfficiency(speedVal),
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
        logger.log('[useTelemetry] Supabase Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          logger.log('[useTelemetry] Successfully subscribed to telemetry_logs table');
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          logger.error('[useTelemetry] Subscription closed or error:', status);
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, sessionId, setTelemetry, setHardwareData, setChartData, setTelemetryHistory, setLastUpdate, setIsConnected, setIsLive, setActiveSessionId]);
}
