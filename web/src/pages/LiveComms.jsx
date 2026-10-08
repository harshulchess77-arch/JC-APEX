import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Send, Mic, MicOff } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import { motion } from 'framer-motion';

const QUICK_CMDS = [
  { label: 'BOX THIS LAP',  color: '#FF1E42' },
  { label: 'PUSH HARD',     color: '#FF1E42' },
  { label: 'SAVE ENERGY',   color: '#10B981' },
  { label: 'HOLD PACE',     color: '#FFB300' },
  { label: 'COOL DOWN',     color: '#8A909D' },
  { label: 'STATUS CHECK',  color: '#FFB300' },
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
    <div className="h-screen bg-[#08090C] flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Radio className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">LIVE COMMS</span>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono">
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            GHOST-LINK™ SECURE CHANNEL ACTIVE
          </div>
          <span className="text-white/20">{formatTime(telemetry.raceTime)}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — telemetry sidebar */}
        <div className="w-48 flex-shrink-0 border-r border-white/[0.06] bg-[#101217] p-3 flex flex-col gap-3 overflow-y-auto">
          <div>
            <div className="text-[7px] font-mono tracking-widest text-white/30 uppercase mb-2">Live Telemetry</div>
            {[
              { label: 'SPEED',   value: `${telemetry.speed.toFixed(1)} mph`, color: '#FF1E42' },
              { label: 'BATTERY', value: `${telemetry.battery.toFixed(1)}%`,  color: '#10B981' },
              { label: 'TEMP',    value: `${telemetry.temp.toFixed(1)}°C`,    color: '#FFB300' },
              { label: 'LAPS',    value: `#${Math.floor(telemetry.lap)}`,     color: '#FF1E42' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                <span className="text-[8px] font-mono text-white/30">{m.label}</span>
                <span className="text-sm font-display font-bold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[7px] font-mono tracking-widest text-white/30 uppercase mb-2">Quick Commands</div>
            <div className="space-y-1">
              {QUICK_CMDS.map(q => (
                <button key={q.label} onClick={() => send(q.label)}
                  className="w-full text-left px-2.5 py-1.5 rounded border border-transparent hover:border-white/[0.06] text-[9px] font-display font-bold tracking-wider transition-all hover:opacity-90 cursor-pointer"
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
                    isSys ? 'bg-white/[0.03] border border-white/[0.04] text-white/30 text-center text-[8px] max-w-xs' :
                             'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] rounded-bl-none'
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
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#101217] p-3">
            <div className="flex items-center gap-2">
              <button
                onMouseDown={() => setPtt(true)} onMouseUp={() => setPtt(false)} onMouseLeave={() => setPtt(false)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded border text-[9px] font-display font-bold tracking-widest transition-all flex-shrink-0 cursor-pointer ${
                  ptt ? 'border-primary/50 bg-primary/20 text-primary animate-pulse' : 'border-white/10 text-white/30 hover:border-white/20'
                }`}>
                {ptt ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                PTT
              </button>
              <input
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Message from pit wall..."
                className="flex-1 px-3 py-2 rounded border border-white/[0.06] bg-[#08090C] text-white/80 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/20" />
              <button onClick={() => send(input)}
                className="px-3 py-2 rounded border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0 cursor-pointer">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}