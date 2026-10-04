import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Send, Mic, MicOff } from 'lucide-react';
import { useTelemetry } from '../hooks/useMockTelemetry';
import { motion } from 'framer-motion';

const QUICK_CMDS = [
  { label: 'BOX THIS LAP',  color: '#ef4444' },
  { label: 'PUSH NOW',      color: '#22c55e' },
  { label: 'SAVE ENERGY',   color: '#eab308' },
  { label: 'HOLD POSITION', color: '#60a5fa' },
  { label: 'COOL DOWN',     color: '#a78bfa' },
  { label: 'STATUS CHECK',  color: '#22d3ee' },
];

export default function LiveComms() {
  const navigate = useNavigate();
  const { commsMessages, sendCommand, telemetry, formatTime } = useTelemetry();
  const [input, setInput] = useState('');
  const [ptt, setPtt] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commsMessages]);

  const send = (msg) => { if (!msg.trim()) return; sendCommand(msg); setInput(''); };

  return (
    <div className="h-screen bg-[#080808] flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Radio className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">LIVE COMMS</span>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono">
          <div className="flex items-center gap-1.5 text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            GHOST-LINK™ SECURE CHANNEL ACTIVE
          </div>
          <span className="text-white/20">{formatTime(telemetry.raceTime)}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — telemetry sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-white/[0.06] bg-[#0b0b0b] p-3 flex flex-col gap-3 overflow-y-auto">
          <div>
            <div className="text-[7px] font-mono tracking-widest text-white/15 uppercase mb-2">Live Telemetry</div>
            {[
              { label: 'SPEED',   value: `${telemetry.speed.toFixed(1)} mph`, color: '#ef4444' },
              { label: 'BATTERY', value: `${telemetry.battery.toFixed(1)}%`,  color: '#22c55e' },
              { label: 'TEMP',    value: `${telemetry.temp.toFixed(1)}°C`,    color: '#eab308' },
              { label: 'LAP',     value: `#${Math.floor(telemetry.lap)}`,     color: '#60a5fa' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                <span className="text-[8px] font-mono text-white/20">{m.label}</span>
                <span className="text-sm font-display font-bold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[7px] font-mono tracking-widest text-white/15 uppercase mb-2">Quick Commands</div>
            <div className="space-y-1">
              {QUICK_CMDS.map(q => (
                <button key={q.label} onClick={() => send(q.label)}
                  className="w-full text-left px-2.5 py-1.5 rounded border border-transparent hover:border-white/[0.06] text-[9px] font-display font-bold tracking-wider transition-all hover:opacity-90"
                  style={{ color: q.color }}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center — message feed */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {commsMessages.map((msg, i) => {
              const isPit = msg.from === 'pit';
              const isSys = msg.from === 'system';
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isPit ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-3.5 py-2.5 rounded-xl text-[10px] font-mono leading-relaxed ${
                    isPit ? 'bg-primary/15 border border-primary/25 text-primary/90 rounded-br-none' :
                    isSys ? 'bg-white/[0.03] border border-white/[0.04] text-white/25 text-center text-[8px] max-w-xs' :
                             'bg-green-500/10 border border-green-500/20 text-green-400 rounded-bl-none'
                  }`}>
                    {!isSys && <div className={`text-[7px] font-bold tracking-widest mb-1 opacity-50 ${isPit ? 'text-right' : ''}`}>
                      {isPit ? 'PIT WALL' : 'DRIVER'} · {msg.time}
                    </div>}
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0c0c0c] p-3">
            <div className="flex items-center gap-2">
              <button
                onMouseDown={() => setPtt(true)} onMouseUp={() => setPtt(false)} onMouseLeave={() => setPtt(false)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded border text-[9px] font-display font-bold tracking-widest transition-all flex-shrink-0 ${
                  ptt ? 'border-primary/50 bg-primary/20 text-primary animate-pulse' : 'border-white/10 text-white/25 hover:border-white/20'
                }`}>
                {ptt ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                PTT
              </button>
              <input
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Message from pit wall..."
                className="flex-1 px-3 py-2 rounded border border-white/[0.06] bg-white/[0.03] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/15" />
              <button onClick={() => send(input)}
                className="px-3 py-2 rounded border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}