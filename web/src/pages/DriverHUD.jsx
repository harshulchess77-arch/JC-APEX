import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRealtimeTelemetry, COMMAND_STATUS } from '../hooks/useRealtimeTelemetry';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';
import { FLAG_CFG, FLAG_MODAL_CFG, STRATEGY_MODAL_CFG } from '../components/driver/FlagConfig';
import DriverTopBar from '../components/driver/DriverTopBar';
import DriverLeftPanel from '../components/driver/DriverLeftPanel';
import SpeedometerPanel from '../components/driver/SpeedometerPanel';
import DriverRightPanel from '../components/driver/DriverRightPanel';

export default function DriverHUD() {
  const navigate = useNavigate();
  const { logout } = usePasscodeAuth();
  const { telemetry, flag: localFlag, oracleMessages, commsMessages, formatTime, targetPace, signalLost, lastPacketTime, isDemoMode, isLive } = useTelemetry();
  const {
    incomingCommands,
    sendAck,
    broadcastDriverStatus,
    driverTelemetry,
    driverStrategyMode,
  } = useRealtimeTelemetry('driver');
  const [focusMode, setFocusMode] = useState(false);
  const [lastAckedFlag, setLastAckedFlag] = useState(null);
  const [lastAckedStrategy, setLastAckedStrategy] = useState(null);
  const [sessionStartTime] = useState(() => Date.now());
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  // Descending 62-minute countdown timer
  const SESSION_DURATION_MS = 62 * 60 * 1000;
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, currentTimestamp - sessionStartTime);
  const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);
  const remainingMinutes = Math.floor(remaining / 60000);
  const remainingSeconds = Math.floor((remaining % 60000) / 1000);
  const timeString = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  // Use flag from realtime broadcast / database if available, otherwise fall back to local state
  const flag = (driverTelemetry?.flag || localFlag || 'green').toLowerCase();
  const flagCfg = FLAG_CFG[flag] || FLAG_CFG.green;
  const flagModalCfg = FLAG_MODAL_CFG[flag] || FLAG_MODAL_CFG.green;
  const showFlagAlert = Boolean(flag && flag !== lastAckedFlag);

  // Strategy Mode Alert trigger
  const activeStrategy = (driverStrategyMode || telemetry?.strategy || 'BALANCED').toUpperCase();
  const strategyModalCfg = STRATEGY_MODAL_CFG[activeStrategy] || STRATEGY_MODAL_CFG.BALANCED;
  const showStrategyAlert = Boolean(activeStrategy && activeStrategy !== lastAckedStrategy);

  const latestOracle = oracleMessages[0];
  const pitMessages = commsMessages.filter(m => m.from === 'pit');

  // Defensive fallbacks for rapid 5 Hz telemetry updates
  const safeTelemetry = telemetry ?? {};
  const safeSpeed = (safeTelemetry.speed ?? 0) || 0;
  const safeBattery = (safeTelemetry.battery ?? 0) || 0;
  const safeTemp = (safeTelemetry.temp ?? 0) || 0;
  const safeVoltage = (safeTelemetry.voltage ?? 0) || 0;
  const safeCurrent = (safeTelemetry.current ?? 0) || 0;
  const safePower = (safeTelemetry.power ?? (safeCurrent * safeVoltage)) || 0;
  const safeEfficiency = (safeTelemetry.efficiency ?? 0) || 0;
  const safeLap = (safeTelemetry.lap ?? 0) || 0;
  const safeRaceTime = (safeTelemetry.raceTime ?? 0) || 0;
  const safeSpeedHall = (safeTelemetry.speed_hall ?? safeSpeed) || 0;
  const safeSpeedGps = (safeTelemetry.speed_gps ?? safeSpeed) || 0;

  // Broadcast driver status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      broadcastDriverStatus(safeTelemetry, incomingCommands[0]);
    }, 1000);
    return () => clearInterval(interval);
  }, [safeTelemetry, incomingCommands, broadcastDriverStatus]);

  const battColor = safeBattery < 20 ? '#FF1E42' : safeBattery < 40 ? '#FFB300' : '#10B981';
  const tempColor = safeTemp > 58 ? '#FF1E42' : safeTemp > 46 ? '#FFB300' : '#10B981';
  const speedColor = safeSpeed > 32 ? '#FF1E42' : '#10B981';

  // Time since last packet for signal status
  const timeSinceLastPacket = Math.floor((Date.now() - lastPacketTime) / 1000);
  const signalStatus = signalLost ? 'LOST' : timeSinceLastPacket < 2 ? 'EXCELLENT' : timeSinceLastPacket < 5 ? 'GOOD' : 'DEGRADED';
  const signalColor = signalLost ? '#ef4444' : timeSinceLastPacket < 2 ? '#22c55e' : timeSinceLastPacket < 5 ? '#eab308' : '#f97316';

  // Current incoming command
  const activeCmd = incomingCommands[0];
  const cmdPayloadText = activeCmd
    ? (activeCmd.payload || activeCmd.commandText || activeCmd.command_name || activeCmd.text || activeCmd.type || 'INCOMING COMMAND')
    : '';

  // Command banner color based on actual command payload
  const getCommandColor = (commandText) => {
    const upper = String(commandText || '').toUpperCase();
    if (upper.includes('BOX')) return { bg: 'bg-[#FF1E42]/20', border: 'border-[#FF1E42]', text: 'text-[#FF1E42]', btnBg: 'bg-[#FF1E42]', btnText: 'text-white' };
    if (upper.includes('PACE DOWN') || upper.includes('HOLD')) return { bg: 'bg-[#FFB300]/20', border: 'border-[#FFB300]', text: 'text-[#FFB300]', btnBg: 'bg-[#FFB300]', btnText: 'text-black' };
    if (upper.includes('TARGET') || upper.includes('SAVE')) return { bg: 'bg-[#10B981]/20', border: 'border-[#10B981]', text: 'text-[#10B981]', btnBg: 'bg-[#10B981]', btnText: 'text-black' };
    if (upper.includes('PUSH')) return { bg: 'bg-[#FF1E42]/20', border: 'border-[#FF1E42]', text: 'text-[#FF1E42]', btnBg: 'bg-[#FF1E42]', btnText: 'text-white' };
    return { bg: 'bg-[#FF1E42]/20', border: 'border-[#FF1E42]', text: 'text-[#FF1E42]', btnBg: 'bg-[#FF1E42]', btnText: 'text-white' };
  };

  const handleAck = (commandId, commandText) => {
    sendAck(commandId, commandText);
  };

  const handleAckFlag = () => {
    setLastAckedFlag(flag);
  };

  const handleAckStrategy = () => {
    setLastAckedStrategy(activeStrategy);
  };

  return (
    <div className={`min-h-screen bg-[#08090C] text-foreground flex flex-col overflow-hidden select-none ${focusMode ? 'fullscreen' : ''}`}>
      {/* Command Banner Overlay with Clickable Touch Target */}
      <AnimatePresence>
        {activeCmd && activeCmd.status !== COMMAND_STATUS.EXPIRED && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            onClick={() => handleAck(activeCmd.id, cmdPayloadText)}
            className={`fixed top-0 left-0 right-0 z-40 p-4 border-b-2 cursor-pointer shadow-2xl transition-all ${getCommandColor(cmdPayloadText).bg} ${getCommandColor(cmdPayloadText).border}`}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${getCommandColor(cmdPayloadText).border.replace('border-', 'bg-')}`} />
                <div>
                  <div className={`text-[10px] font-mono tracking-widest ${getCommandColor(cmdPayloadText).text} uppercase font-bold`}>
                    {activeCmd.sender || 'PIT'} COMMAND DIRECTIVE
                  </div>
                  <div className={`text-xl md:text-2xl font-display font-black tracking-wider ${getCommandColor(cmdPayloadText).text}`}>
                    {cmdPayloadText}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAck(activeCmd.id, cmdPayloadText);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 text-sm font-display font-black tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer ${getCommandColor(cmdPayloadText).btnBg} ${getCommandColor(cmdPayloadText).btnText} ${getCommandColor(cmdPayloadText).border}`}
              >
                <CheckCircle2 className="w-5 h-5" />
                ACKNOWLEDGE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Massive Fullscreen Flag Alert Overlay (Task 6) */}
      <AnimatePresence>
        {showFlagAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={handleAckFlag}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer ${flagModalCfg.bg}`}
          >
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className={`text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-black tracking-widest mb-4 uppercase ${flagModalCfg.text} ${flagModalCfg.pulse ? 'animate-pulse' : ''}`}>
                {flag.toUpperCase()} FLAG
              </div>
              <div className={`text-lg sm:text-2xl md:text-3xl font-mono font-bold tracking-wider mb-8 uppercase ${flagModalCfg.subText}`}>
                {flagModalCfg.description}
              </div>
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAckFlag();
                  }}
                  className={`w-full py-6 md:py-8 rounded-2xl font-display font-black text-xl md:text-2xl tracking-widest uppercase transition-all shadow-2xl active:scale-95 cursor-pointer ${flagModalCfg.buttonClass}`}
                >
                  TAP TO ACKNOWLEDGE FLAG
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Massive Strategy/Mode Alert Overlay (Task 7) */}
      <AnimatePresence>
        {showStrategyAlert && activeStrategy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleAckStrategy}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer ${strategyModalCfg.bg}`}
          >
            <div className="w-full max-w-4xl flex flex-col items-center">
              <div className={`text-sm md:text-base font-mono font-bold tracking-[0.3em] uppercase mb-3 ${strategyModalCfg.subText}`}>
                PIT STRATEGY DIRECTIVE
              </div>
              <div className={`text-6xl sm:text-8xl md:text-9xl font-display font-black tracking-widest mb-4 uppercase ${strategyModalCfg.text}`}>
                {activeStrategy}
              </div>
              <div className={`text-lg sm:text-2xl md:text-3xl font-mono font-bold tracking-wider mb-8 uppercase ${strategyModalCfg.subText}`}>
                {strategyModalCfg.description}
              </div>
              <div className="w-full max-w-md">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAckStrategy();
                  }}
                  className={`w-full py-6 md:py-8 rounded-2xl font-display font-black text-xl md:text-2xl tracking-widest uppercase transition-all shadow-2xl active:scale-95 cursor-pointer ${strategyModalCfg.buttonClass}`}
                >
                  ACKNOWLEDGE MODE CHANGE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus mode toggle button */}
      <button
        onClick={() => setFocusMode(!focusMode)}
        className="fixed top-2 right-2 z-50 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 text-[8px] font-mono tracking-widest transition-all"
      >
        {focusMode ? 'EXIT FOCUS' : 'FOCUS MODE'}
      </button>

      {/* Top bar - hidden in focus mode */}
      {!focusMode && (
        <DriverTopBar
          focusMode={focusMode}
          flag={flag}
          isDemoMode={isDemoMode}
          isLive={isLive}
          safeLap={safeLap}
          timeString={timeString}
          safeBattery={safeBattery}
          signalStatus={signalStatus}
          signalColor={signalColor}
          signalLost={signalLost}
          onLogout={() => { logout(); navigate('/login'); }}
        />
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
        {/* Left panel - hidden in focus mode */}
        {!focusMode && (
          <DriverLeftPanel pitMessages={pitMessages} safeLap={safeLap} />
        )}

        {/* Center — Speedometer */}
        <SpeedometerPanel
          focusMode={focusMode}
          safeSpeed={safeSpeed}
          speedColor={speedColor}
          targetPace={targetPace}
          safeEfficiency={safeEfficiency}
          safeBattery={safeBattery}
          battColor={battColor}
          safeVoltage={safeVoltage}
          safeCurrent={safeCurrent}
          safePower={safePower}
          safeSpeedHall={safeSpeedHall}
          safeSpeedGps={safeSpeedGps}
          latestOracle={latestOracle}
          formatTime={formatTime}
          safeRaceTime={safeRaceTime}
        />

        {/* Right panel - hidden in focus mode */}
        {!focusMode && (
          <DriverRightPanel
            safeVoltage={safeVoltage}
            safeCurrent={safeCurrent}
            safeBattery={safeBattery}
            battColor={battColor}
            safeTemp={safeTemp}
            safeLap={safeLap}
          />
        )}
      </div>
    </div>
  );
}