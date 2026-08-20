import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Users, Gauge } from 'lucide-react';

const DEFAULTS = {
  total_laps: 12,
  our_name: 'Johns Creek',
  our_number: '55',
  comp1_name: 'Northview',
  comp1_number: '14',
  comp2_name: 'Team Ampere',
  comp2_number: '22',
};

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">{label}</div>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
    </div>
  );
}

function CarBlock({ title, color, name, number, onName, onNumber, namePh, numPh }) {
  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">{title}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2"><Field label="Driver Name" value={name} onChange={onName} placeholder={namePh} /></div>
        <Field label="Car #" value={number} onChange={onNumber} placeholder={numPh} />
      </div>
    </div>
  );
}

export default function RaceSetupPanel({ open, onClose, onStart, isRunning, onStop }) {
  const [cfg, setCfg] = useState(DEFAULTS);
  const set = (k) => (v) => setCfg(prev => ({ ...prev, [k]: v }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
            className="w-full max-w-lg rounded-lg border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#0a0a0a]">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />
                <span className="font-display font-black text-sm tracking-widest text-white">RACE SETUP</span>
              </div>
              <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Race length */}
              <div className="rounded border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 mb-2.5">
                  <Gauge className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Race Configuration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Total Laps</div>
                    <input type="number" min={1} max={50} value={cfg.total_laps}
                      onChange={e => set('total_laps')(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-display font-bold text-lg focus:outline-none focus:border-primary/30" />
                  </div>
                  <div className="text-[8px] font-mono text-white/25 leading-relaxed">
                    Lap logging begins the moment the race starts. Each lap is recorded for all three cars with live timing & gaps.
                  </div>
                </div>
              </div>

              {/* Cars */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-white/20" />
                  <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Participants</span>
                </div>
                <CarBlock title="Our Car" color="#ef4444"
                  name={cfg.our_name} number={cfg.our_number}
                  onName={set('our_name')} onNumber={set('our_number')}
                  namePh="Our driver" numPh="7" />
                <CarBlock title="Competitor 1" color="#60a5fa"
                  name={cfg.comp1_name} number={cfg.comp1_number}
                  onName={set('comp1_name')} onNumber={set('comp1_number')}
                  namePh="Competitor 1" numPh="14" />
                <CarBlock title="Competitor 2" color="#a78bfa"
                  name={cfg.comp2_name} number={cfg.comp2_number}
                  onName={set('comp2_name')} onNumber={set('comp2_number')}
                  namePh="Competitor 2" numPh="22" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-[#0a0a0a]">
              <span className="text-[8px] font-mono text-white/20">
                {isRunning ? '● A race is currently running' : 'Ready to start'}
              </span>
              <div className="flex gap-2">
                {isRunning && (
                  <button onClick={() => { onStop(); onClose(); }}
                    className="px-4 py-2 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-display font-bold tracking-widest hover:bg-primary/20 transition-all">
                    END CURRENT RACE
                  </button>
                )}
                <button onClick={() => { onStart(cfg); onClose(); }}
                  className="flex items-center gap-2 px-5 py-2 rounded border border-green-400/40 bg-green-600 text-white text-[10px] font-display font-bold tracking-widest hover:bg-green-500 transition-all">
                  ▶ START RACE
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}