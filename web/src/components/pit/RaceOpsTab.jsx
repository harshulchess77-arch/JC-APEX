import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Flag, RotateCcw } from 'lucide-react';
import CommandAckPanel from './CommandAckPanel';

const FLAG_CONFIG = {
  green:  { label: 'GREEN',  cls: 'bg-green-700 hover:bg-green-600 text-white' },
  yellow: { label: 'YELLOW', cls: 'bg-yellow-600 hover:bg-yellow-500 text-black font-black' },
  red:    { label: 'RED',    cls: 'bg-[#FF1E42] hover:bg-[#FF1E42]/90 text-white' },
  black:  { label: 'BLACK',  cls: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' },
};

const LapTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const lapStartTimeRef = useRef(0);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - lapStartTimeRef.current);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!isRunning) {
      lapStartTimeRef.current = Date.now() - elapsedTime;
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleLap = () => {
    if (isRunning) {
      const currentLapTime = elapsedTime;
      setLaps(prev => [{ lap: prev.length + 1, time: currentLapTime, split: currentLapTime - (prev.length > 0 ? prev[prev.length - 1].time : 0) }, ...prev]);
      lapStartTimeRef.current = Date.now();
      setElapsedTime(0);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
    lapStartTimeRef.current = 0;
  };

  return (
    <div className="rounded border border-white/[0.06] bg-[#101217] p-3 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flag className="w-3 h-3 text-primary" />
          <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Lap Timer</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handleReset} className="p-1.5 rounded bg-white/[0.05] text-white/30 hover:text-white/60 hover:bg-white/10 transition-all cursor-pointer">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="text-center py-4 mb-3">
        <div className="text-4xl font-display font-black text-white tracking-wider">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-[8px] font-mono text-white/20 mt-1">TOTAL ELAPSED</div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button onClick={handleStart} disabled={isRunning}
          className="py-2 rounded bg-green-600/20 border border-green-600/30 text-green-400 text-[9px] font-display font-bold tracking-wider hover:bg-green-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 cursor-pointer">
          <Play className="w-3 h-3" /> START
        </button>
        <button onClick={handleStop} disabled={!isRunning}
          className="py-2 rounded bg-red-600/20 border border-red-600/30 text-red-400 text-[9px] font-display font-bold tracking-wider hover:bg-red-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 cursor-pointer">
          <Square className="w-3 h-3" /> STOP
        </button>
        <button onClick={handleLap} disabled={!isRunning}
          className="py-2 rounded bg-[#FF1E42]/20 border border-[#FF1E42]/30 text-[#FF1E42] text-[9px] font-display font-bold tracking-wider hover:bg-[#FF1E42]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
          LAP
        </button>
      </div>

      {/* Lap History */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {laps.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white/10 mx-auto mb-2" />
            <p className="text-[8px] font-mono text-white/15">No laps recorded</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-2 px-2 py-1 text-[7px] font-mono text-white/20 uppercase tracking-wider">
              <span>Lap</span>
              <span className="text-right">Time</span>
              <span className="text-right">Split</span>
            </div>
            {laps.map((lap) => (
              <div key={lap.lap} className="grid grid-cols-3 gap-2 px-2 py-1.5 rounded bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[9px] font-mono text-white/60">#{lap.lap}</span>
                <span className="text-[9px] font-mono text-white/80 text-right">{formatTime(lap.time)}</span>
                <span className="text-[9px] font-mono text-primary/60 text-right">{formatTime(lap.split)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function RaceOpsTab({ flag, onFlagChange }) {
  const [incidents, setIncidents] = useState([]);
  const [incidentInput, setIncidentInput] = useState('');

  const addIncident = () => {
    if (!incidentInput.trim()) return;
    setIncidents(prev => [...prev, { id: Date.now(), text: incidentInput, time: new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    setIncidentInput('');
  };

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {/* Command & ACK pager */}
      <CommandAckPanel />

      {/* Flags + Incidents + Lap Timer */}
      <div className="flex flex-col gap-3">
        <div className="rounded border border-white/[0.06] bg-[#101217] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Race Control · Flags</span>
            <div className={`w-2 h-2 rounded-full ${
              flag === 'green' ? 'bg-green-500' : flag === 'yellow' ? 'bg-yellow-500' : flag === 'red' ? 'bg-primary' : 'bg-white/30'
            }`} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(FLAG_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => onFlagChange(key)}
                className={`py-2.5 rounded text-[10px] font-display font-black tracking-widest transition-all cursor-pointer ${cfg.cls} ${
                  flag === key ? 'ring-1 ring-white/30' : 'opacity-50 hover:opacity-80'
                }`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <LapTimer />

        <div className="rounded border border-white/[0.06] bg-[#101217] p-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Incident Log</span>
              {incidents.length > 0 && (
                <span className="text-[7px] font-mono px-1.5 rounded bg-primary/20 text-primary">{incidents.length}</span>
              )}
            </div>
            {incidents.length > 0 && (
              <button onClick={() => setIncidents([])} className="text-[8px] font-mono text-white/15 hover:text-white/40 transition-colors cursor-pointer">CLEAR</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-3">
            {incidents.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mb-2" />
                <p className="text-[8px] font-mono text-white/15">No incidents logged</p>
              </div>
            ) : incidents.map(inc => (
              <div key={inc.id} className="text-[9px] font-mono px-2 py-1.5 rounded border border-white/[0.04] bg-white/[0.02]">
                <div className="flex items-start gap-2">
                  <span className="text-white/30 flex-shrink-0">[{inc.time}]</span>
                  <span className="font-bold tracking-wider text-[#FF1E42]">RACE CONTROL:</span>
                  <span className="text-white/60">{inc.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={incidentInput} onChange={e => setIncidentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIncident()}
              placeholder="Log incident…"
              className="flex-1 px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/60 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            <button onClick={addIncident} className="px-2.5 py-1.5 rounded border border-primary/25 text-primary text-[9px] font-display font-bold hover:bg-primary/10 transition-colors tracking-wider cursor-pointer">
              + LOG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}