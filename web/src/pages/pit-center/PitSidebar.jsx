import React from 'react';
import { Zap, Gauge, CheckCircle2 } from 'lucide-react';
import SpeedDial from '../../components/pit/SpeedDial';
import { COMMAND_STATUS } from '../../hooks/useRealtimeTelemetry';
import { FLAGS, STRATEGY_MODES } from './pit-constants';

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

export default function PitSidebar({
  telemetry,
  strategy,
  flag,
  setFlag,
  handleStrategyChange,
  handleSendCommand,
  formatTime,
  commandHistory,
  oracleMessages,
}) {
  const battColor = telemetry.battery < 20 ? '#FF1E42' : telemetry.battery < 40 ? '#FFB300' : '#10B981';
  const latestOracle = oracleMessages[0];
  const oracleSev = latestOracle?.severity || 'nominal';

  return (
    <aside className="w-[200px] flex-shrink-0 border-r border-white/[0.06] bg-[#101217] flex flex-col overflow-y-auto">

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
          <span className="text-3xl font-display font-black" style={{ color: battColor }}>{(telemetry.battery ?? 0).toFixed(0)}</span>
          <span className="text-white/25 font-mono text-xs">%</span>
          <span className="ml-auto text-sm font-display font-bold text-[#FF1E42]">{(telemetry.voltage ?? 0).toFixed(1)}V</span>
        </div>
        <BatteryBar battery={telemetry.battery} />
        <div className="flex items-center justify-between mt-1.5 text-[8px] font-mono text-white/20">
          <span>PACE TARGET —</span>
          <span className="text-green-400 font-bold">OPTIMAL</span>
        </div>
      </div>

      {/* Pit Communication Quick Actions */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Quick Commands</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button onClick={() => handleSendCommand('BOX THIS LAP')}
            className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-[#FF1E42]/10 border border-[#FF1E42]/30 text-[#FF1E42] hover:bg-[#FF1E42]/20 cursor-pointer">
            BOX THIS LAP
          </button>
          <button onClick={() => handleSendCommand('PACE DOWN')}
            className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-[#FFB300]/10 border border-[#FFB300]/30 text-[#FFB300] hover:bg-[#FFB300]/20 cursor-pointer">
            PACE DOWN
          </button>
          <button onClick={() => handleSendCommand('TARGET PACE: 25 MPH')}
            className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20 cursor-pointer">
            TARGET 25 MPH
          </button>
          <button onClick={() => handleSendCommand('PUSH HARD')}
            className="py-2 rounded text-[9px] font-display font-bold tracking-wider transition-all bg-[#FF1E42]/10 border border-[#FF1E42]/30 text-[#FF1E42] hover:bg-[#FF1E42]/20 cursor-pointer">
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
            <button key={s.id} onClick={() => handleStrategyChange(s.id)}
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
          <span>COMPLETED <span className="text-white/40 font-bold">{Math.floor(telemetry.lap)} LAPS</span></span>
          <span>· 62M TIME CAP</span>
        </div>
      </div>
    </aside>
  );
}
