import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, LogIn, Zap, Gauge, Radio, ChevronRight } from 'lucide-react';
import { useTelemetry } from '../hooks/useMockTelemetry';
import { useRealtimeTelemetry, COMMAND_TYPES, COMMAND_STATUS } from '../hooks/useRealtimeTelemetry';
import SpeedDial from '../components/pit/SpeedDial';
import OverviewTab from '../components/pit/OverviewTab';
import OracleTab from '../components/pit/OracleTab';
import RaceOpsTab from '../components/pit/RaceOpsTab';
import PostAnalysisTab from '../components/pit/PostAnalysisTab';
import StrategyBoard from '../components/command/StrategyBoard';

const TABS = [
  { id: 'overview',      label: 'OVERVIEW'       },
  { id: 'ai-oracle',     label: 'AI ORACLE'      },
  { id: 'strategy',      label: 'STRATEGY BOARD' },
  { id: 'race-ops',      label: 'RACE OPS'       },
  { id: 'post-analysis', label: 'POST-ANALYSIS'  },
];

const STRATEGY_MODES = [
  { id: 'aggressive', label: 'AGGRESSIVE', sub: 'MAX POWER', clr: '#ef4444' },
  { id: 'balanced',   label: 'BALANCED',   sub: 'OPTIMAL',   clr: '#eab308' },
  { id: 'conserve',   label: 'CONSERVE',   sub: 'ECO MODE',  clr: '#22c55e' },
];

const FLAGS = [
  { key: 'green',  label: 'GREEN',  cls: 'bg-green-700 hover:bg-green-600 text-white' },
  { key: 'yellow', label: 'YELLOW', cls: 'bg-yellow-600 hover:bg-yellow-500 text-black font-black' },
  { key: 'red',    label: 'RED',    cls: 'bg-red-700 hover:bg-red-600 text-white' },
  { key: 'black',  label: 'BLACK',  cls: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' },
];

function BatteryBar({ battery }) {
  const blocks = 10;
  const filled = Math.round((battery / 100) * blocks);
  const getColor = (i) => {
    if (i >= 8) return '#22c55e';
    if (i >= 5) return '#eab308';
    return '#ef4444';
  };
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-sm transition-all"
          style={{ backgroundColor: i < filled ? getColor(i) : 'rgba(255,255,255,0.05)' }} />
      ))}
    </div>
  );
}

function MetricChip({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 border-r border-white/5 last:border-r-0">
      <span className="text-xs font-display font-bold" style={{ color, textShadow: `0 0 10px ${color}60` }}>{value}</span>
      <span className="text-[8px] font-mono text-white/20 tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

export default function PitCenter() {
  const navigate = useNavigate();
  const {
    telemetry, strategy, setStrategy,
    flag, setFlag, oracleMessages, commsMessages,
    chartData, sendCommand: legacySendCommand, formatTime, estimatedLapsRemaining, signalLost, lastPacketTime
  } = useTelemetry();
  const {
    connectionMode: realtimeConnectionMode,
    commandHistory,
    sendCommand: realtimeSendCommand,
  } = useRealtimeTelemetry('pit');
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionActive, setSessionActive] = useState(false);

  const battColor = telemetry.battery < 20 ? '#ef4444' : telemetry.battery < 40 ? '#eab308' : '#22c55e';
  const tempColor = telemetry.temp > 58 ? '#ef4444' : telemetry.temp > 46 ? '#eab308' : '#22d3ee';
  const latestOracle = oracleMessages[0];
  const oracleSev = latestOracle?.severity || 'nominal';

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

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col overflow-hidden">

      {/* ─── HEADER ─── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-10 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <span className="text-[8px] font-black text-white">JC</span>
            </div>
            <span className="font-display font-black text-sm tracking-widest text-white">APEX</span>
            <span className="text-white/15 text-xs font-mono ml-1">RACE INTELLIGENCE</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <button className="text-[9px] font-mono tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
            PIT COMMAND SUITE
          </button>
          <button onClick={() => navigate('/drivers')}
            className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">
            <Users className="w-3 h-3" /> DRIVERS
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-green-400 tracking-widest">GHOST-LINK™ ACTIVE</span>
          </div>
          {/* Signal Status */}
          <div className="flex items-center gap-1.5 text-[8px] font-mono">
            <span className="text-white/20">SIGNAL:</span>
            <span className={signalLost ? 'text-red-400 animate-pulse' : 'text-green-400'}>
              {signalLost ? 'LOST' : `${Math.floor((Date.now() - lastPacketTime) / 1000)}s ago`}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/20">
            {sessionActive ? '● SESSION LIVE' : '○ STANDBY'}
          </span>
          <button onClick={() => setSessionActive(v => !v)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-display font-bold tracking-widest uppercase transition-all ${
              sessionActive
                ? 'bg-[#1a0000] border border-primary/50 text-primary'
                : 'bg-green-600 border border-green-400/50 text-white hover:bg-green-500'
            }`}>
            {sessionActive ? '■ TERMINATE' : '▶ INITIATE SESSION'}
          </button>
          <button onClick={() => navigate('/')} className="text-white/15 hover:text-white/40 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── METRICS STRIP ─── */}
      <div className="flex-shrink-0 flex items-center border-b border-white/[0.06] bg-[#0a0a0a] overflow-x-auto">
        <MetricChip label="BATTERY" value={`${telemetry.battery.toFixed(1)}%`} color={battColor} />
        <MetricChip label="TEMP" value={`${telemetry.temp.toFixed(1)}°C`} color={tempColor} />
        <MetricChip label="EFFICIENCY" value={`${telemetry.efficiency.toFixed(0)}%`} color="#a78bfa" />
        <MetricChip label="POWER" value={`${(telemetry.current * telemetry.voltage).toFixed(0)}W`} color="#60a5fa" />
        <MetricChip label="VOLTAGE" value={`${telemetry.voltage.toFixed(1)}V`} color="#60a5fa" />
        <MetricChip label="CURRENT" value={`${telemetry.current.toFixed(1)}A`} color="#818cf8" />
        <MetricChip label="SPEED" value={`${telemetry.speed.toFixed(1)}`} color="#ef4444" />
        <MetricChip label="LAP" value={`#${Math.floor(telemetry.lap)}`} color="#22c55e" />
        <MetricChip label="DISTANCE" value={`${(Math.floor(telemetry.lap) * 0.25).toFixed(2)}mi`} color="#a78bfa" />
        <div className="ml-auto flex-shrink-0 px-3">
          <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded border tracking-widest ${
            flag === 'green'  ? 'border-green-500/40 text-green-400 bg-green-500/10' :
            flag === 'yellow' ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' :
            flag === 'red'    ? 'border-primary/40 text-primary bg-primary/10 animate-pulse' :
                                'border-white/10 text-white/30 bg-white/5'
          }`}>● {flag.toUpperCase()}</span>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── SIDEBAR ─── */}
        <aside className="w-[200px] flex-shrink-0 border-r border-white/[0.06] bg-[#0b0b0b] flex flex-col overflow-y-auto">

          {/* Speed Dial */}
          <div className="p-3 pb-2 border-b border-white/[0.06]">
            <SpeedDial speed={telemetry.speed} maxSpeed={40} throttle={Math.round(telemetry.efficiency)} mode={strategy.toUpperCase()} />
          </div>

          {/* Energy Cell */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-2.5 h-2.5 text-primary" />
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Energy Cell</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-3xl font-display font-black" style={{ color: battColor }}>{telemetry.battery.toFixed(0)}</span>
              <span className="text-white/25 font-mono text-xs">%</span>
              <span className="ml-auto text-sm font-display font-bold text-blue-400">{telemetry.voltage.toFixed(1)}V</span>
            </div>
            <BatteryBar battery={telemetry.battery} />
            <div className="flex items-center justify-between mt-1.5 text-[8px] font-mono text-white/20">
              <span>EST. REMAINING —</span>
              <span className="text-green-400 font-bold">{estimatedLapsRemaining} LAPS</span>
            </div>
          </div>

          {/* Pit Communication Quick Actions */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Quick Commands</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => handleSendCommand('BOX THIS LAP')}
                className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20">
                BOX THIS LAP
              </button>
              <button onClick={() => handleSendCommand('PACE DOWN')}
                className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 relative">
                PACE DOWN
              </button>
              <button onClick={() => handleSendCommand('TARGET PACE: 25 MPH')}
                className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20">
                TARGET 25 MPH
              </button>
              <button onClick={() => handleSendCommand('PUSH HARD')}
                className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20">
                PUSH HARD
              </button>
            </div>
          </div>

          {/* Driver Response Status */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-2.5 h-2.5 text-white/20" />
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Driver Response Status</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {commandHistory.length === 0 ? (
                <div className="text-[8px] font-mono text-white/15 text-center py-2">No commands sent</div>
              ) : (
                commandHistory.slice(-5).reverse().map(cmd => (
                  <div key={cmd.id} className={`flex items-center justify-between px-2 py-1.5 rounded text-[8px] font-mono border ${
                    cmd.status === COMMAND_STATUS.ACKNOWLEDGED 
                      ? 'border-green-500/30 bg-green-500/5 text-green-400' 
                      : cmd.status === COMMAND_STATUS.SENT
                      ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
                      : 'border-white/5 bg-white/[0.02] text-white/30'
                  }`}>
                    <span className="truncate max-w-[120px]">{cmd.payload}</span>
                    <span className="flex items-center gap-1">
                      {cmd.status === COMMAND_STATUS.ACKNOWLEDGED && <CheckCircle2 className="w-3 h-3" />}
                      {cmd.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Race Control */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Race Control · Flags</span>
              <div className={`w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0 ${
                flag === 'green' ? 'bg-green-500' : flag === 'yellow' ? 'bg-yellow-500' : 'bg-primary'
              }`} />
            </div>
            <div className="grid grid-cols-2 gap-1">
              {FLAGS.map(f => (
                <button key={f.key} onClick={() => setFlag(f.key)}
                  className={`py-1.5 rounded text-[9px] font-display font-bold tracking-wider transition-all ${f.cls} ${
                    flag === f.key ? 'ring-1 ring-white/25' : 'opacity-50 hover:opacity-80'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Race Strategy */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-2">
              <Gauge className="w-2.5 h-2.5 text-white/20" />
              <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Race Strategy</span>
            </div>
            <div className="space-y-1">
              {STRATEGY_MODES.map(s => (
                <button key={s.id} onClick={() => setStrategy(s.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded border text-[10px] font-display font-bold tracking-wider transition-all ${
                    strategy === s.id
                      ? 'bg-white/5 border-white/10'
                      : 'border-transparent text-white/20 hover:text-white/40 hover:bg-white/3'
                  }`}
                  style={strategy === s.id ? { color: s.clr, borderColor: `${s.clr}30` } : {}}>
                  <span>{s.label}</span>
                  <span className="text-[8px] font-mono opacity-50">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Oracle alert */}
          {latestOracle && (
            <div className={`mx-3 my-2 px-2.5 py-2 rounded border text-[9px] font-mono leading-relaxed ${
              oracleSev === 'critical' ? 'border-primary/25 bg-primary/5 text-primary' :
              oracleSev === 'warning'  ? 'border-yellow-500/25 bg-yellow-500/5 text-yellow-400' :
                                         'border-green-500/25 bg-green-500/5 text-green-400'
            }`}>
              <div className="text-[7px] font-bold tracking-widest opacity-50 mb-0.5">ORACLE</div>
              {latestOracle.text}
            </div>
          )}

          {/* Race time */}
          <div className="p-3 mt-auto border-t border-white/[0.06]">
            <div className="text-[7px] font-mono text-white/15 tracking-wider mb-1">RACE TIME</div>
            <div className="text-xl font-display font-black text-primary">{formatTime(telemetry.raceTime)}</div>
            <div className="flex items-center gap-2 mt-1 text-[8px] font-mono text-white/20">
              <span>LAP <span className="text-white/40 font-bold">{Math.floor(telemetry.lap)}</span></span>
              <span>/ {telemetry.totalLaps}</span>
            </div>
          </div>
        </aside>

        {/* ─── MAIN AREA ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex-shrink-0 flex items-center border-b border-white/[0.06] bg-[#0a0a0a] overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[9px] font-display font-bold tracking-[0.2em] uppercase transition-all flex-shrink-0 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-white/20 hover:text-white/40'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'overview'      && <OverviewTab telemetry={telemetry} chartData={chartData} oracleMessages={oracleMessages} />}
            {activeTab === 'ai-oracle'     && <OracleTab oracleMessages={oracleMessages} telemetry={telemetry} />}
            {activeTab === 'strategy'      && <StrategyBoard />}
            {activeTab === 'race-ops'      && <RaceOpsTab flag={flag} onFlagChange={setFlag} commsMessages={commsMessages} onSendCommand={handleSendCommand} />}
            {activeTab === 'post-analysis' && <PostAnalysisTab telemetry={telemetry} chartData={chartData} />}
          </div>
        </div>
      </div>

      {/* ─── STATUS BAR ─── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-7 border-t border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex items-center gap-3 text-[8px] font-mono">
          <span className="text-green-400">● TELEMETRY LIVE · 20Hz</span>
          <span className="text-white/10">·</span>
          <span className="text-white/20">ORACLE v2</span>
          <span className="text-white/10">·</span>
          <span className="text-white/15">GHOST-LINK™</span>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono text-white/20">
          <span>BATT <span style={{ color: battColor }}>{telemetry.battery.toFixed(1)}%</span></span>
          <span>TEMP <span style={{ color: tempColor }}>{telemetry.temp.toFixed(1)}°C</span></span>
          <span>EFF <span className="text-purple-400">{telemetry.efficiency.toFixed(0)}%</span></span>
          <span>V <span className="text-blue-400">{telemetry.voltage.toFixed(1)}</span></span>
        </div>
      </div>
    </div>
  );
}