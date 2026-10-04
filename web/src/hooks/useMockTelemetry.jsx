import { useState, useEffect, useRef, useCallback } from 'react';

const INITIAL_TELEMETRY = {
  speed: 0.00,
  battery: 100,
  temp: 0,
  voltage: 0.00,
  current: 0.00,
  efficiency: 0,
  lap: 0,
  totalLaps: 0,
  raceTime: 0,
};

function generateOracleMessage(telemetry) {
  if (telemetry.battery < 15) {
    return { text: `CRITICAL: Battery at ${telemetry.battery.toFixed(0)}%. Emergency conserve mode required.`, severity: 'critical' };
  }
  if (telemetry.temp > 62) {
    return { text: `Motor temp ${telemetry.temp.toFixed(0)}°C — approaching 75°C critical. Reduce load immediately.`, severity: 'critical' };
  }
  if (telemetry.battery < 30) {
    return { text: `Battery at ${telemetry.battery.toFixed(0)}%. Deficit projected. Switch to CONSERVE mode.`, severity: 'warning' };
  }
  if (telemetry.temp > 50) {
    return { text: `Thermal gradient elevated: ${telemetry.temp.toFixed(1)}°C. Monitor rise rate.`, severity: 'warning' };
  }
  if (telemetry.efficiency > 82) {
    return { text: `Systems nominal. Efficiency ${telemetry.efficiency.toFixed(0)}%. Push window is open.`, severity: 'nominal' };
  }
  if (telemetry.voltage < 39) {
    return { text: `Voltage sag detected: ${telemetry.voltage.toFixed(1)}V. Cell load is high.`, severity: 'warning' };
  }
  return null;
}

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [strategy, setStrategy] = useState('balanced');
  const [flag, setFlag] = useState('green');
  const [oracleMessages, setOracleMessages] = useState([
    { text: 'System initialized. All telemetry nominal.', severity: 'nominal', time: '00:00', id: 0 },
    { text: 'Oracle Core v2 online. Monitoring 6 subsystems.', severity: 'nominal', time: '00:01', id: 1 },
  ]);
  const [commsMessages, setCommsMessages] = useState([
    { from: 'system', text: 'Comms link established. Secure channel active.', time: '00:00' },
    { from: 'system', text: 'Telemetry stream active at 20Hz.', time: '00:01' },
  ]);
  const [chartData, setChartData] = useState([]);
  const msgIdRef = useRef(2);
  const tickRef = useRef(0);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  // Main telemetry tick
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      setTelemetry(prev => {
        const stratMult = strategy === 'aggressive' ? 1.45 : strategy === 'conserve' ? 0.55 : 1;
        const flagMult = flag === 'yellow' ? 0.5 : (flag === 'red' || flag === 'black') ? 0 : 1;
        const drainRate = (0.12 + Math.random() * 0.08) * stratMult * flagMult;
        const tempDelta = (0.07 + Math.random() * 0.05) * stratMult * flagMult - 0.035;
        const speedBase = strategy === 'aggressive' ? 33 : strategy === 'conserve' ? 21 : 28;

        const newBattery = Math.max(0, Math.min(100, prev.battery - drainRate));
        const newTemp = Math.max(18, Math.min(80, prev.temp + tempDelta));
        const stopped = flag === 'red' || flag === 'black';
        const newSpeed = stopped ? 0 : Math.max(0, speedBase + (Math.random() - 0.5) * 4) * flagMult;
        const newVoltage = 36 + (newBattery / 100) * 12 + (Math.random() - 0.5) * 0.25;
        const newCurrent = newSpeed > 0 ? 7 + (newSpeed / 35) * 9 + (Math.random() - 0.5) * 1 : 0.4;
        const newEfficiency = newSpeed > 0 ? Math.min(95, 58 + (newBattery / 100) * 28 + (Math.random() - 0.5) * 4) : 0;
        const newLap = Math.min(prev.totalLaps, prev.lap + (newSpeed > 18 ? 0.0018 : 0));

        return {
          ...prev,
          speed: newSpeed,
          battery: newBattery,
          temp: newTemp,
          voltage: newVoltage,
          current: newCurrent,
          efficiency: newEfficiency,
          lap: newLap,
          raceTime: prev.raceTime + 1,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [strategy, flag]);

  // Chart accumulation
  useEffect(() => {
    setChartData(prev => {
      const point = {
        time: formatTime(telemetry.raceTime),
        speed: +telemetry.speed.toFixed(1),
        battery: +telemetry.battery.toFixed(1),
        temp: +telemetry.temp.toFixed(1),
        efficiency: +telemetry.efficiency.toFixed(1),
        voltage: +telemetry.voltage.toFixed(2),
      };
      const next = [...prev, point];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, [telemetry.raceTime]);

  // Oracle messages
  useEffect(() => {
    if (tickRef.current % 10 !== 0 || tickRef.current === 0) return;
    const msg = generateOracleMessage(telemetry);
    if (msg) {
      msgIdRef.current += 1;
      setOracleMessages(prev => [
        { ...msg, time: formatTime(telemetry.raceTime), id: msgIdRef.current },
        ...prev.slice(0, 11),
      ]);
    }
  }, [telemetry.raceTime]);

  const sendCommand = useCallback((text) => {
    const time = formatTime(telemetry.raceTime);
    setCommsMessages(prev => [...prev, { from: 'pit', text, time }]);
    setTimeout(() => {
      setCommsMessages(prev => [...prev, { from: 'system', text: `ACK: "${text}"`, time }]);
    }, 800);
  }, [telemetry.raceTime, formatTime]);

  return {
    telemetry,
    strategy, setStrategy,
    flag, setFlag,
    oracleMessages,
    commsMessages,
    chartData,
    sendCommand,
    formatTime,
  };
}