import React, { useState } from 'react';
import { Cpu, AlertTriangle, Check, Bell, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_THRESHOLDS = [
  { id: 't1', label: 'High Temp Warning',  condition: 'Temperature exceeds 75°C',   severity: 'warning',  active: true },
  { id: 't2', label: 'Low Battery Critical', condition: 'Battery drops below 20%', severity: 'critical', active: true },
  { id: 't3', label: 'Voltage Sag Alert',  condition: 'Voltage drops below 38V',   severity: 'critical', active: true },
];

const SCENARIO = [
  { label: 'Battery Drain Rate',  value: '0.8%/min', bar: 8 },
  { label: 'Avg Lap Speed',       value: '22 mph',   bar: 55 },
  { label: 'Thermal Load Factor', value: '1x',       bar: 20 },
  { label: 'System Efficiency',   value: '65%',      bar: 65 },
  { label: 'Laps Remaining',      value: '15 laps',  bar: 75 },
];

export default function OracleTab({ oracleMessages, telemetry }) {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [autoMode, setAutoMode] = useState(true);

  const toggle = (id) => setThresholds(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  const remove = (id) => setThresholds(prev => prev.filter(t => t.id !== id));

  return (
    <div className="grid grid-cols-2 gap-3 h-full">

      {/* Left — AI Engine */}
      <div className="flex flex-col gap-3">
        {/* Threshold manager */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Pit AI Engine</span>
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-primary/30 text-primary">AI LIVE</span>
            </div>
            <button onClick={() => setAutoMode(v => !v)}
              className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-colors ${
                autoMode ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-white/20'
              }`}>AUTO</button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-mono tracking-widest text-white/20 uppercase">Alert Thresholds</span>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-yellow-500/25 text-yellow-500">
              {thresholds.filter(t => t.active).length} ACTIVE
            </span>
          </div>

          <div className="space-y-1.5">
            {thresholds.map(t => (
              <div key={t.id} className={`flex items-start gap-2 p-2 rounded border transition-all ${
                t.active
                  ? t.severity === 'critical' ? 'border-primary/20 bg-primary/5' : 'border-yellow-500/20 bg-yellow-500/5'
                  : 'border-white/[0.04] opacity-30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                  t.active ? t.severity === 'critical' ? 'bg-primary' : 'bg-yellow-500' : 'bg-white/20'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-display font-bold text-white/70">{t.label}</span>
                    <span className={`text-[7px] font-mono px-1 rounded ${
                      t.active && t.severity === 'critical' ? 'bg-primary/20 text-primary' :
                      t.active ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white/20'
                    }`}>{t.severity.toUpperCase()}</span>
                  </div>
                  <p className="text-[8px] font-mono text-white/25">{t.condition}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggle(t.id)} className="text-white/15 hover:text-white/50 transition-colors">
                    <Bell className="w-3 h-3" />
                  </button>
                  <button onClick={() => remove(t.id)} className="text-white/15 hover:text-primary transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Telemetry strip */}
          <div className="flex items-center gap-3 pt-2 mt-2 border-t border-white/[0.04] text-[8px] font-mono text-white/20">
            <span>Batt: <span className="text-green-400">{telemetry.battery.toFixed(1)}%</span></span>
            <span>Temp: <span className="text-yellow-400">{telemetry.temp.toFixed(1)}°C</span></span>
            <span>Eff: <span className="text-purple-400">{telemetry.efficiency.toFixed(0)}%</span></span>
          </div>
        </div>

        {/* Oracle Core V2 live log */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Oracle Core V2</span>
            </div>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-green-500/30 text-green-400">● LIVE</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {oracleMessages.slice(0, 8).map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  className={`text-[9px] font-mono px-2.5 py-1.5 rounded border flex items-start gap-2 ${
                    msg.severity === 'critical' ? 'border-primary/20 bg-primary/5 text-primary' :
                    msg.severity === 'warning'  ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' :
                                                   'border-green-500/15 bg-green-500/5 text-green-400'
                  }`}>
                  {msg.severity === 'critical' ? <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> :
                   msg.severity === 'warning'  ? <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> :
                                                 <Check className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                  <span className="opacity-40 mr-1 text-[7px] flex-shrink-0">{msg.time}</span>
                  {msg.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right — Scenario Builder */}
      <div className="flex flex-col gap-3">
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Scenario Builder</span>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded border border-primary/30 text-primary">WHAT IF</span>
          </div>
          <div className="space-y-3">
            {SCENARIO.map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-display font-bold text-white/50">{s.label}</span>
                  <span className="text-sm font-display font-black text-primary">{s.value}</span>
                </div>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.bar}%`, boxShadow: '0 0 6px #ef4444' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-2 text-[8px] font-mono text-white/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Oracle simulating scenario...
          </div>
        </div>

        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">Strategy Advisor</span>
          </div>
          <p className="text-[9px] font-mono text-green-400">All systems nominal. No action required.</p>
        </div>
      </div>
    </div>
  );
}