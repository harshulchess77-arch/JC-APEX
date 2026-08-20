import React, { useState } from 'react';
import CommandAckPanel from './CommandAckPanel';

const FLAG_CONFIG = {
  green:  { label: 'GREEN',  cls: 'bg-green-700 hover:bg-green-600 text-white' },
  yellow: { label: 'YELLOW', cls: 'bg-yellow-600 hover:bg-yellow-500 text-black font-black' },
  red:    { label: 'RED',    cls: 'bg-red-700 hover:bg-red-600 text-white' },
  black:  { label: 'BLACK',  cls: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' },
};

export default function RaceOpsTab({ flag, onFlagChange }) {
  const [incidents, setIncidents] = useState([]);
  const [incidentInput, setIncidentInput] = useState('');

  const addIncident = () => {
    if (!incidentInput.trim()) return;
    setIncidents(prev => [...prev, { id: Date.now(), text: incidentInput, time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    setIncidentInput('');
  };

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {/* Command & ACK pager */}
      <CommandAckPanel />

      {/* Flags + Incidents */}
      <div className="flex flex-col gap-3">
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Race Control · Flags</span>
            <div className={`w-2 h-2 rounded-full ${
              flag === 'green' ? 'bg-green-500' : flag === 'yellow' ? 'bg-yellow-500' : flag === 'red' ? 'bg-primary' : 'bg-white/30'
            }`} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(FLAG_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => onFlagChange(key)}
                className={`py-2.5 rounded text-[10px] font-display font-black tracking-widest transition-all ${cfg.cls} ${
                  flag === key ? 'ring-1 ring-white/30' : 'opacity-50 hover:opacity-80'
                }`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Incident Log</span>
              {incidents.length > 0 && (
                <span className="text-[7px] font-mono px-1.5 rounded bg-primary/20 text-primary">{incidents.length}</span>
              )}
            </div>
            {incidents.length > 0 && (
              <button onClick={() => setIncidents([])} className="text-[8px] font-mono text-white/15 hover:text-white/40 transition-colors">CLEAR</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-3">
            {incidents.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mb-2" />
                <p className="text-[8px] font-mono text-white/15">No incidents logged</p>
              </div>
            ) : incidents.map(inc => (
              <div key={inc.id} className="text-[9px] font-mono px-2 py-1.5 rounded border border-white/[0.04] text-white/40">
                <span className="text-primary/40 mr-2 text-[7px]">{inc.time}</span>{inc.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={incidentInput} onChange={e => setIncidentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIncident()}
              placeholder="Log incident…"
              className="flex-1 px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/60 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            <button onClick={addIncident} className="px-2.5 py-1.5 rounded border border-primary/25 text-primary text-[9px] font-display font-bold hover:bg-primary/10 transition-colors tracking-wider">
              + LOG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}