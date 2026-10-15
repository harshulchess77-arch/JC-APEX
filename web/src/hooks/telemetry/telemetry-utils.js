import { useMemo, useCallback } from 'react';
import { telemetryService } from '@/services/telemetryService';

export function useTelemetryAlerts(telemetry) {
  const thermalAlert = useMemo(() => telemetryService.getThermalAlert(telemetry.temp), [telemetry.temp]);
  const voltageAlert = useMemo(() => telemetryService.getVoltageAlert(telemetry.voltage), [telemetry.voltage]);

  return { thermalAlert, voltageAlert };
}

export function useSessionData() {
  const fetchSessionData = useCallback(async (sessionIdParam, limit = 100) => {
    return telemetryService.fetchSessionData(sessionIdParam, limit);
  }, []);

  const fetchSessionMetrics = useCallback(async (sessionIdParam) => {
    return telemetryService.fetchSessionMetrics(sessionIdParam);
  }, []);

  const fetchAvailableSessions = useCallback(async () => {
    return telemetryService.fetchAvailableSessions();
  }, []);

  return {
    fetchSessionData,
    fetchSessionMetrics,
    fetchAvailableSessions,
  };
}
