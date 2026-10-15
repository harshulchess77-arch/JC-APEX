import { useEffect } from 'react';

export function useTelemetryWatchdog({ isDemoMode, lastUpdate, setTelemetry, setIsLive }) {
  useEffect(() => {
    if (isDemoMode) {
      return; // Do not drop metrics in Demo Mode
    }

    const watchdog = setInterval(() => {
      if (!lastUpdate) {
        setIsLive(false);
        setTelemetry(prev => {
          if (prev.current === 0.00 && prev.voltage === 0.00 && prev.speed === 0.00) {
            return prev; // Already zero, skip re-render
          }
          return {
            ...prev,
            current: 0.00,
            voltage: 0.00,
            power: 0.00,
            speed: 0.00,
            speed_hall: 0.00,
            speed_gps: 0.00,
          };
        });
        return;
      }

      const elapsed = Date.now() - lastUpdate.getTime();
      const alive = elapsed < 3000;
      setIsLive(alive);

      if (!alive) {
        setTelemetry(prev => {
          if (prev.current === 0.00 && prev.voltage === 0.00 && prev.speed === 0.00) {
            return prev; // Already zero, skip re-render
          }
          return {
            ...prev,
            current: 0.00,
            voltage: 0.00,
            power: 0.00,
            speed: 0.00,
            speed_hall: 0.00,
            speed_gps: 0.00,
          };
        });
      }
    }, 1000);

    return () => clearInterval(watchdog);
  }, [lastUpdate, isDemoMode, setTelemetry, setIsLive]);
}
