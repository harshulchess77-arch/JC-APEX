import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const oracleExamples = [
  {
    id: 'bat-deficit',
    tag: 'BATTERY / DRAIN ANALYSIS',
    input: [
      { key: 'Battery', val: '28%' },
      { key: 'Drain Rate', val: '9.2%/min' },
      { key: 'Laps Remaining', val: '4.1' },
      { key: 'Projected End', val: '11.4%' },
    ],
    reasoning: 'At current drain rate, battery will reach critical threshold (10%) with 0.4 laps remaining. Deficit window: 2.3 laps.',
    output: 'Switch to CONSERVE mode immediately. Reduce motor load by 18%. Projected recovery: battery reaches finish at 12.3%.',
    action: 'APPLY CONSERVE MODE',
    severity: 'warning',
  },
  {
    id: 'thermal',
    tag: 'THERMAL / MOTOR ANALYSIS',
    input: [
      { key: 'Motor Temp', val: '58°C' },
      { key: 'Rise Rate', val: '+2.4°C/min' },
      { key: 'Critical Threshold', val: '75°C' },
      { key: 'Time to Critical', val: '~7.1 min' },
    ],
    reasoning: 'Thermal gradient exceeds safe operating curve. At current rate, motor will reach 75°C in 7 minutes. Structural risk elevated.',
    output: 'Reduce load by 12% for 3 laps. Activate cooldown protocol. Monitor delta rate — target: below +1.2°C/min.',
    action: 'INITIATE COOLDOWN PROTOCOL',
    severity: 'warning',
  },
  {
    id: 'nominal',
    tag: 'SYSTEM-WIDE / FULL SCAN',
    input: [
      { key: 'Battery', val: '72%' },
      { key: 'Temp', val: '34°C' },
      { key: 'Efficiency', val: '81%' },
      { key: 'Voltage', val: '44.8V' },
    ],
    reasoning: 'All subsystems within optimal operating envelopes. Energy margin is positive for remaining 8 laps. No anomalies detected.',
    output: 'All systems nominal. Push window is open. You may increase pace — aggressive mode is viable for next 3 laps.',
    action: 'ENABLE AGGRESSIVE MODE',
    severity: 'nominal',
  },
  {
    id: 'critical',
    tag: 'BATTERY / CRITICAL EVENT',
    input: [
      { key: 'Battery', val: '11%' },
      { key: 'Voltage', val: '38.2V (DROPPING)' },
      { key: 'Current', val: '21.4A' },
      { key: 'Deficit', val: 'IMMINENT' },
    ],
    reasoning: 'Voltage sag detected at 11%. Current draw of 21.4A is unsustainable. Cell depletion cascade imminent within 1.8 min.',
    output: 'CRITICAL — CUT motor power to 30%. Signal driver immediately. Prioritize finish-line crossing over pace.',
    action: 'EMERGENCY PROTOCOL',
    severity: 'critical',
  },
];

const severityConfig = {
  nominal: {
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    dot: 'bg-green-500',
    text: 'text-green-500',
    icon: CheckCircle2,
    label: 'NOMINAL',
  },
  warning: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    dot: 'bg-yellow-500',
    text: 'text-yellow-500',
    icon: AlertTriangle,
    label: 'WARNING',
  },
  critical: {
    border: 'border-primary/40',
    bg: 'bg-primary/5',
    dot: 'bg-primary',
    text: 'text-primary',
    icon: AlertCircle,
    label: 'CRITICAL',
  },
};

export default function OracleEngine() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % oracleExamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const active = oracleExamples[activeIndex];
  const cfg = severityConfig[active.severity];
  const SeverityIcon = cfg.icon;

  return (
    <section className="relative py-32 px-4 border-t border-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] text-primary/80 uppercase mb-4">
            <Brain className="w-3.5 h-3.5" />
            Oracle Core v2 — Live Demo
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mb-4">
            The Engine That <span className="text-primary">Thinks</span> For You
          </h2>
          <p className="text-sm font-mono text-muted-foreground/60 max-w-xl mx-auto">
            Oracle Core is a deterministic, algorithmic intelligence engine — not generative AI. 
            It analyzes live telemetry, runs failure models, and surfaces exact tactical decisions 
            with reasoning you can trust under race pressure.
          </p>
        </motion.div>

        {/* Tab selectors */}
        <div className="flex flex-wrap justify-center gap-2 mt-10 mb-8">
          {oracleExamples.map((ex, i) => {
            const c = severityConfig[ex.severity];
            return (
              <button
                key={ex.id}
                onClick={() => setActiveIndex(i)}
                className={`px-3 py-1.5 rounded border text-xs font-mono tracking-wider transition-all ${
                  i === activeIndex
                    ? `${c.border} ${c.bg} ${c.text} font-bold`
                    : 'border-border text-muted-foreground/50 hover:text-muted-foreground'
                }`}
              >
                {ex.tag.split(' / ')[0]}
              </button>
            );
          })}
        </div>

        {/* Oracle display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className={`rounded border ${cfg.border} ${cfg.bg} p-6 max-w-3xl mx-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SeverityIcon className={`w-4 h-4 ${cfg.text}`} />
                <span className={`text-xs font-mono font-bold tracking-[0.2em] ${cfg.text}`}>
                  {active.tag}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${cfg.border} ${cfg.bg}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                <span className={`text-[10px] font-mono font-bold ${cfg.text}`}>{cfg.label}</span>
              </div>
            </div>

            {/* Input grid */}
            <div className="mb-5">
              <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2">
                ◆ INPUT STATE
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {active.input.map((item) => (
                  <div key={item.key} className="bg-background/40 rounded border border-border/50 p-2.5">
                    <div className="text-[10px] font-mono text-muted-foreground/50 uppercase mb-1">{item.key}</div>
                    <div className="text-sm font-mono font-bold text-foreground">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasoning */}
            <div className="mb-4">
              <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-2">
                ◆ ORACLE REASONING
              </div>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed bg-background/30 rounded p-3 border border-border/40">
                {active.reasoning}
              </p>
            </div>

            {/* Output */}
            <div className="mb-4">
              <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${cfg.text} opacity-70`}>
                ◆ ORACLE DECISION
              </div>
              <p className={`text-sm font-mono font-semibold ${cfg.text} leading-relaxed`}>
                {active.output}
              </p>
            </div>

            {/* Action */}
            <button className={`w-full flex items-center justify-center gap-2 py-2.5 rounded border ${cfg.border} ${cfg.bg} text-xs font-mono font-bold tracking-wider uppercase ${cfg.text} hover:opacity-80 transition-opacity`}>
              {active.action}
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {oracleExamples.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}