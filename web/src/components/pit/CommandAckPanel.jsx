import React, { useState, useEffect, useRef } from 'react';
import { Radio, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRealtimeTelemetry, COMMAND_STATUS } from '@/hooks/useRealtimeTelemetry';

const COMMANDS = [
  { id: 'BOX THIS LAP', label: 'BOX THIS LAP', color: '#FF1E42' },
  { id: 'PUSH HARD',    label: 'PUSH HARD',    color: '#FF1E42' },
  { id: 'SAVE ENERGY',  label: 'SAVE ENERGY',  color: '#10B981' },
  { id: 'HOLD PACE',    label: 'HOLD PACE',    color: '#FFB300' },
];

export default function CommandAckPanel() {
  const { commandHistory, sendCommand } = useRealtimeTelemetry('pit');
  const [sending, setSending] = useState(null);
  const scrollRef = useRef(null);

  // Map commandHistory to UI format
  const messages = commandHistory.map(cmd => ({
    id: cmd.id,
    commandText: cmd.payload || cmd.type,
    status: cmd.status === COMMAND_STATUS.ACKNOWLEDGED ? 'Acknowledged' : 'Pending',
    timestamp: cmd.timestamp,
    ack_timestamp: cmd.ackedAt,
  }));

  const send = async (cmd) => {
    setSending(cmd);
    sendCommand('COMMAND', cmd);
    setSending(null);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  };

  return (
    <div className="flex flex-col rounded border border-white/[0.06] bg-[#101217] overflow-hidden h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] bg-[#08090C]/40">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Pit Command &amp; ACK Chat</span>
        </div>
        <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-[#10B981]/30 text-[#10B981] bg-[#10B981]/10">
          ● GHOST-LINK™ LIVE
        </span>
      </div>

      {/* Quick Action Directive Buttons */}
      <div className="p-3 border-b border-white/[0.06] bg-[#08090C]/20">
        <div className="text-[7px] font-mono tracking-widest text-white/30 uppercase mb-2">Transmit Directive</div>
        <div className="grid grid-cols-2 gap-2">
          {COMMANDS.map(c => (
            <button
              key={c.id}
              onClick={() => send(c.id)}
              disabled={sending === c.id}
              className="py-2.5 px-3 rounded text-[11px] font-display font-black tracking-wider transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer text-left flex items-center justify-between"
              style={{
                background: `${c.color}15`,
                border: `1px solid ${c.color}50`,
                color: c.color,
                boxShadow: `0 0 12px ${c.color}20`
              }}
            >
              <span>{sending === c.id ? 'TRANSMITTING...' : c.label}</span>
              <span className="text-[9px] opacity-40 font-mono">▶</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat-Style Live Command Log Feed */}
      <div className="p-3 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between text-[7px] font-mono tracking-widest text-white/30 uppercase mb-2">
          <span>Real-Time Comm Protocol</span>
          <span>{messages.length} EVENTS</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-6 h-6 text-white/10 mx-auto mb-2" />
              <p className="text-[9px] font-mono text-white/20">No directives transmitted yet this session.</p>
            </div>
          ) : (
            messages.slice(0, 30).map((m) => {
              const isAck = m.status === 'Acknowledged' || m.status === 'ACKNOWLEDGED';
              const pitTime = formatTimestamp(m.timestamp);
              const ackTime = formatTimestamp(m.ack_timestamp || m.timestamp);

              return (
                <div key={m.id || m.messageId} className="space-y-1">
                  {/* PIT Command Event (Aligned Left) */}
                  <div className="flex items-start justify-start">
                    <div className="max-w-[85%] rounded border border-[#FF1E42]/30 bg-[#FF1E42]/10 p-2 text-[10px] font-mono shadow-sm">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white/30 text-[8px]">[{pitTime}]</span>
                        <span className="px-1.5 py-0.2 rounded font-black text-[8px] bg-[#FF1E42] text-white tracking-widest">
                          PIT
                        </span>
                        <span className="font-bold text-[#FF1E42] tracking-wider">
                          {m.commandText}
                        </span>
                      </div>
                      {!isAck && (
                        <div className="flex items-center gap-1.5 text-[8px] text-[#FFB300] mt-1 pt-1 border-t border-white/[0.04]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB300] animate-pulse" />
                          <span>TRANSMITTED · AWAITING DRIVER ACK</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DRIVER Acknowledgment Event (Aligned Right) */}
                  {isAck && (
                    <div className="flex items-start justify-end pl-6">
                      <div className="max-w-[85%] rounded border border-[#10B981]/40 bg-[#10B981]/10 p-2 text-[10px] font-mono shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-[8px]">[{ackTime}]</span>
                          <span className="px-1.5 py-0.2 rounded font-black text-[8px] bg-[#10B981] text-black tracking-widest">
                            DRIVER
                          </span>
                          <span className="font-bold text-[#10B981] tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                            ACKNOWLEDGED
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}