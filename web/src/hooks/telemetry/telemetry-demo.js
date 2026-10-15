import { useState, useEffect, useRef } from 'react';
import { telemetryService } from '@/services/telemetryService';

export function useDemoTelemetry({ enabled, strategy, flag, setTelemetry, setHardwareData, setChartData, setTelemetryHistory, setLastUpdate, setOracleMessages }) {
  const demoTickRef = useRef(0);
  const oracleMsgIdRef = useRef(2);

  useEffect(() => {
    if (!enabled) {
      return;
    }

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
      gpsFix: true,
      sats: 12,
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
      const mockBattery = telemetryService.calculateBatteryPercentage(mockVolts);

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
        gpsFix: true,
        sats: 10 + Math.floor(Math.sin(t * 0.05) * 2),
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
  }, [enabled, strategy, flag, setTelemetry, setHardwareData, setChartData, setTelemetryHistory, setLastUpdate, setOracleMessages]);
}
