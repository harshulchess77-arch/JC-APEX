import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COMMANDS = [
  { id: 'BOX NOW',    label: 'BOX NOW',    color: '#ef4444' },
  { id: 'PUSH HARD',  label: 'PUSH HARD',  color: '#f97316' },
  { id: 'SAVE FUEL',  label: 'SAVE FUEL',  color: '#eab308' },
  { id: 'PIT CANCEL', label: 'PIT CANCEL', color: '#3b82f6' },
];

const STATUS_CFG = {
  Pending:      { clr: '#eab308', label: 'TRANSMITTING' },
  Delivered:    { clr: '#3b82f6', label: 'DELIVERED' },
  Acknowledged: { clr: '#22c55e', label: 'DRIVER CONFIRMED' },
};

export default function CommandAckPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const list = await base44.entities.RaceMessage.list('-created_date', 50);
        setMessages(list || []);
      } catch {}
      setLoading(false);
      unsub = base44.entities.RaceMessage.subscribe((event) => {
        setMessages(prev => {
          let next;
          if (event.type === 'create') next = [event.data, ...prev];
          else if (event.type === 'delete') return prev.filter(m => m.id !== event.data.id);
          else next = prev.map(m => (m.id === event.data.id ? event.data : m));
          next.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
          return next;
        });
      });
    })();
    return () => unsub?.();
  }, []);

  const send = async (cmd) => {
    setSending(cmd);
    try {
      await base44.entities.RaceMessage.create({
        messageId: String(Date.now()),
        commandText: cmd,
        status: 'Pending',
        timestamp: new Date().toISOString(),
      });
    } catch {}
    setSending(null);
  };

  const active = messages.find(m => m.status !== 'Acknowledged') || messages[0];
  const statusCfg = active ? STATUS_CFG[active.status] : null;

  return (
    <div className="flex flex-col rounded border border-white/[0.06] bg-[#0e0e0e] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Command &amp; ACK</span>
        </div>
        <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-green-500/25 text-green-400">● LORA-LINK</span>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-2">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          {COMMANDS.map(c => (
            <button key={c.id} onClick={() => send(c.id)} disabled={sending === c.id}
              className="py-3 rounded text-[12px] font-display font-black tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: `${c.color}15`, border: `1px solid ${c.color}50`, color: c.color, textShadow: `0 0 12px ${c.color}40` }}>
              {sending === c.id ? '···' : c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Command Status */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-2">Live Command Status</div>
        <AnimatePresence mode="wait">
          {active && statusCfg ? (
            <motion.div key={active.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded border p-4 mb-3 text-center"
              style={{ borderColor: `${statusCfg.clr}40`, background: `${statusCfg.clr}10` }}>
              <div className="text-[8px] font-mono tracking-widest mb-2" style={{ color: statusCfg.clr }}>
                {active.commandText}
              </div>
              {active.status === 'Pending' && (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: statusCfg.clr }} />
                  <div className="text-[10px] font-display font-bold tracking-widest mt-2" style={{ color: statusCfg.clr }}>{statusCfg.label}</div>
                </div>
              )}
              {active.status === 'Delivered' && (
                <div className="flex flex-col items-center">
                  <Radio className="w-10 h-10" style={{ color: statusCfg.clr }} />
                  <div className="text-[10px] font-display font-bold tracking-widest mt-2" style={{ color: statusCfg.clr }}>{statusCfg.label}</div>
                </div>
              )}
              {active.status === 'Acknowledged' && (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-16 h-16" style={{ color: statusCfg.clr, filter: `drop-shadow(0 0 12px ${statusCfg.clr})` }} />
                  <div className="text-[14px] font-display font-black tracking-widest mt-2" style={{ color: statusCfg.clr }}>DRIVER CONFIRMED</div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-6 text-[9px] font-mono text-white/20">No commands sent</div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          {messages.slice(0, 8).map(m => {
            const cfg = STATUS_CFG[m.status];
            return (
              <div key={m.id} className="flex items-center justify-between text-[9px] font-mono px-2 py-1 rounded border border-white/[0.04]">
                <span className="text-white/40">{m.commandText}</span>
                <span style={{ color: cfg.clr }} className="font-bold tracking-wider">{m.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}