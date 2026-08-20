import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const LOG_TEMPLATES = [
  { level: 'INFO',    msg: 'Oracle Core v2 telemetry cycle complete. 6 subsystems nominal.',  src: 'ORACLE' },
  { level: 'INFO',    msg: 'Chart data buffer updated. 80 points retained.',                  src: 'TELEMETRY' },
  { level: 'WARN',    msg: 'Battery drain rate elevated: 0.92%/min vs projected 0.80%/min.', src: 'BATTERY' },
  { level: 'INFO',    msg: 'Ghost-Link™ heartbeat acknowledged. Latency 8ms.',                src: 'COMMS' },
  { level: 'INFO',    msg: 'Strategy mode: BALANCED. Multiplier applied: 1.0x.',              src: 'STRATEGY' },
  { level: 'INFO',    msg: 'Lap counter incremented: 5/12.',                                  src: 'RACE' },
  { level: 'WARN',    msg: 'Thermal gradient: +0.12°C/s. Approaching caution threshold.',    src: 'THERMAL' },
  { level: 'ERROR',   msg: 'Voltage sag transient detected. 41.2V → 38.8V. Duration 0.4s.', src: 'POWER' },
  { level: 'INFO',    msg: 'Oracle prediction updated. Push window opens at lap 7.',          src: 'ORACLE' },
  { level: 'SUCCESS', msg: 'Telemetry stream stable. 20Hz confirmed.',                        src: 'TELEMETRY' },
];

const LEVEL_STYLE = {
  INFO:    { color: '#60a5fa', icon: Info,         bg: 'bg-blue-500/5 border-blue-500/15'    },
  WARN:    { color: '#eab308', icon: AlertTriangle, bg: 'bg-yellow-500/5 border-yellow-500/15' },
  ERROR:   { color: '#ef4444', icon: AlertCircle,  bg: 'bg-primary/5 border-primary/15'      },
  SUCCESS: { color: '#22c55e', icon: CheckCircle,  bg: 'bg-green-500/5 border-green-500/15'  },
};

const METRICS = [
  { label: 'Oracle Cycles',   value: '1,240', unit: 'total',   color: '#a78bfa' },
  { label: 'Avg Latency',     value: '8',     unit: 'ms',      color: '#22c55e' },
  { label: 'Error Rate',      value: '0.4',   unit: '%',       color: '#eab308' },
  { label: 'Uptime',          value: '99.8',  unit: '%',       color: '#22c55e' },
  { label: 'Telemetry Hz',    value: '20',    unit: 'Hz',      color: '#60a5fa' },
  { label: 'Dropped Packets', value: '3',     unit: 'total',   color: '#ef4444' },
];

export default function SystemLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState(() =>
    Array.from({ length: 15 }, (_, i) => {
      const t = LOG_TEMPLATES[i % LOG_TEMPLATES.length];
      return { ...t, id: i, time: new Date(Date.now() - (15 - i) * 4000).toLocaleTimeString() };
    })
  );
  const [filter, setFilter] = useState('ALL');
  const bottomRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      setLogs(prev => [...prev.slice(-99), { ...t, id: Date.now(), time: new Date().toLocaleTimeString() }]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">SYSTEM LOGS</span>
        </div>
        <div className="flex items-center gap-1">
          {['ALL', 'INFO', 'WARN', 'ERROR', 'SUCCESS'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[8px] font-mono tracking-widest transition-colors ${
                filter === f ? 'bg-primary/15 text-primary border border-primary/25' : 'text-white/20 hover:text-white/40'
              }`}>{f}</button>
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        {/* Metrics */}
        <div className="grid grid-cols-6 gap-3 flex-shrink-0">
          {METRICS.map(m => (
            <div key={m.label} className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 text-center">
              <div className="text-[7px] font-mono tracking-widest text-white/20 mb-1">{m.label}</div>
              <div className="text-xl font-display font-black" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[7px] font-mono text-white/15">{m.unit}</div>
            </div>
          ))}
        </div>

        {/* Log stream */}
        <div className="flex-1 rounded border border-white/[0.06] bg-[#0a0a0a] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
            <span className="text-[8px] font-display font-bold tracking-widest text-white/30 uppercase">Live Log Stream</span>
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[10px]">
            {filtered.map(log => {
              const cfg = LEVEL_STYLE[log.level];
              const Icon = cfg.icon;
              return (
                <div key={log.id} className={`flex items-start gap-2.5 px-2.5 py-1.5 rounded border ${cfg.bg}`}>
                  <Icon className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                  <span className="text-white/20 flex-shrink-0 text-[8px]">{log.time}</span>
                  <span className="text-[8px] flex-shrink-0 font-bold" style={{ color: cfg.color }}>[{log.src}]</span>
                  <span className="text-white/50">{log.msg}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}