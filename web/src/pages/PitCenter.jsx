import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRealtimeTelemetry, COMMAND_TYPES } from '../hooks/useRealtimeTelemetry';
import OverviewTab from '../components/pit/OverviewTab';
import OracleTab from '../components/pit/OracleTab';
import RaceOpsTab from '../components/pit/RaceOpsTab';
import PostAnalysisTab from '../components/pit/PostAnalysisTab';
import DriverProfilesTab from '../components/pit/DriverProfilesTab';
import StrategyBoard from '../components/command/StrategyBoard';
import CircuitMapTab from '../components/pit/CircuitMapTab';
import PitHeader, { MetricChip } from './pit-center/PitHeader';
import PitSidebar from './pit-center/PitSidebar';
import { TABS } from './pit-center/pit-constants';

export default function PitCenter() {
  const {
    telemetry, strategy, setStrategy,
    flag, setFlag, oracleMessages, commsMessages,
    chartData, sendCommand: legacySendCommand, formatTime, estimatedLapsRemaining, signalLost, lastPacketTime,
    sessionId, telemetryHistory, isDemoMode, isLive
  } = useTelemetry();
  const {
    connectionMode: realtimeConnectionMode,
    commandHistory,
    sendCommand: realtimeSendCommand,
    broadcastFlagChange,
    broadcastStrategyChange,
  } = useRealtimeTelemetry('pit');
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionActive, setSessionActive] = useState(false);

  const handleSendCommand = (commandText) => {
    // Use realtime hook for actual dispatch
    let commandType;
    if (commandText === 'BOX THIS LAP') commandType = COMMAND_TYPES.BOX_THIS_LAP;
    else if (commandText === 'PACE DOWN') commandType = COMMAND_TYPES.PACE_DOWN;
    else if (commandText.includes('TARGET')) commandType = COMMAND_TYPES.TARGET_PACE;
    else if (commandText === 'PUSH HARD') commandType = COMMAND_TYPES.PUSH_HARD;
    else commandType = 'COMMAND';

    realtimeSendCommand(commandType, commandText);
    // Also use legacy for UI feedback
    legacySendCommand(commandText);
  };

  const handleFlagChange = (newFlag) => {
    setFlag(newFlag);
    broadcastFlagChange(newFlag);
  };

  const handleStrategyChange = (newStrategy) => {
    setStrategy(newStrategy);
    if (broadcastStrategyChange) {
      broadcastStrategyChange(newStrategy);
    }
  };

  const battColor = telemetry.battery < 20 ? '#FF1E42' : telemetry.battery < 40 ? '#FFB300' : '#10B981';
  const tempColor = telemetry.temp > 58 ? '#FF1E42' : telemetry.temp > 46 ? '#FFB300' : '#10B981';

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col overflow-hidden">

      <PitHeader
        telemetry={telemetry}
        isDemoMode={isDemoMode}
        isLive={isLive}
        signalLost={signalLost}
        lastPacketTime={lastPacketTime}
        sessionActive={sessionActive}
        setSessionActive={setSessionActive}
        sessionId={sessionId}
        telemetryHistory={telemetryHistory}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        flag={flag}
      />

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── SIDEBAR ─── */}
        <PitSidebar
          telemetry={telemetry}
          strategy={strategy}
          flag={flag}
          setFlag={handleFlagChange}
          handleStrategyChange={handleStrategyChange}
          handleSendCommand={handleSendCommand}
          formatTime={formatTime}
          commandHistory={commandHistory}
          oracleMessages={oracleMessages}
        />

        {/* ─── MAIN AREA ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex-shrink-0 flex items-center border-b border-white/[0.06] bg-[#101217] overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[9px] font-display font-bold tracking-[0.2em] uppercase transition-all flex-shrink-0 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#FF1E42] text-[#FF1E42] bg-[rgba(255,30,66,0.15)]'
                    : 'border-transparent text-white/20 hover:text-white/40'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'overview'        && <OverviewTab telemetry={telemetry} chartData={chartData} oracleMessages={oracleMessages} />}
            {activeTab === 'ai-oracle'       && <OracleTab oracleMessages={oracleMessages} telemetry={telemetry} />}
            {activeTab === 'strategy'        && <StrategyBoard />}
            {activeTab === 'race-ops'        && <RaceOpsTab flag={flag} onFlagChange={handleFlagChange} commsMessages={commsMessages} onSendCommand={handleSendCommand} />}
            {activeTab === 'circuit-map'     && <CircuitMapTab />}
            {activeTab === 'driver-profiles' && <DriverProfilesTab />}
            {activeTab === 'post-analysis'   && (
              <PostAnalysisTab
                telemetry={telemetry}
                chartData={chartData}
                sessionId={sessionId}
                telemetryHistory={telemetryHistory}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── STATUS BAR ─── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-7 border-t border-white/[0.06] bg-[#101217]">
        <div className="flex items-center gap-3 text-[8px] font-mono">
          <span className="text-[#10B981]">● TELEMETRY LIVE · 20Hz</span>
          <span className="text-white/10">·</span>
          <span className="text-white/20">ORACLE v2</span>
          <span className="text-white/10">·</span>
          <span className="text-white/15">GHOST-LINK™</span>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono text-white/20">
          <span>BATT <span style={{ color: battColor }}>{(telemetry.battery ?? 0).toFixed(1)}%</span></span>
          <span>TEMP <span style={{ color: tempColor }}>{(telemetry.temp ?? 0).toFixed(1)}°C</span></span>
          <span>EFF <span className="text-[#10B981]">{(telemetry.efficiency ?? 0).toFixed(0)}%</span></span>
          <span>V <span className="text-[#FF1E42]">{(telemetry.voltage ?? 0).toFixed(1)}V</span></span>
        </div>
      </div>
    </div>
  );
}
