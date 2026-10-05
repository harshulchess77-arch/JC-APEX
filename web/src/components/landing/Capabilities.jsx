import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, Radio, Box, Flag, Gauge } from 'lucide-react';

const capabilities = [
  {
    icon: Activity,
    tag: 'CORE',
    title: 'Real-Time Telemetry Engine',
    desc: 'Physics-based simulation at 20Hz. Speed, battery, thermal, voltage, current, and efficiency — streamed live with zero interpolation.',
    metrics: ['20Hz refresh', '6 sensors', '<10ms lag'],
  },
  {
    icon: Brain,
    tag: 'INTELLIGENCE',
    title: 'Oracle Core v2',
    desc: 'Deterministic prediction engine running battery drain models, thermal regression, and voltage sag curves — no AI hallucination, just math.',
    metrics: ['±0.4% error', 'Real-time', 'Explainable'],
  },
  {
    icon: Radio,
    tag: 'COMMUNICATIONS',
    title: 'F1-Style Pit Comms',
    desc: 'Authenticated pit-to-driver command layer with timestamped log, instant mode push, and full session replay.',
    metrics: ['<50ms latency', 'Command log', 'Mode push'],
  },
  {
    icon: Box,
    tag: 'VISUALIZATION',
    title: 'Digital Twin',
    desc: '3D kart model with live data mapping. Speed warps geometry, thermal data glows the motor, tilt reflects real suspension physics.',
    metrics: ['3D live', 'Thermal map', 'Physics sync'],
  },
  {
    icon: Flag,
    tag: 'SAFETY',
    title: 'Flag Control System',
    desc: 'Green, Yellow, Red, Black flags with automatic speed limiting and protocol enforcement baked into the strategy engine.',
    metrics: ['4 flags', 'Auto-limit', 'Protocol lock'],
  },
  {
    icon: Gauge,
    tag: 'STRATEGY',
    title: 'Dynamic Strategy Engine',
    desc: 'Aggressive, Balanced, Conserve modes with real-time efficiency tracking, Oracle integration, and one-tap application from any screen.',
    metrics: ['3 modes', 'Oracle-linked', 'One-tap apply'],
  },
];

export default function Capabilities() {
  return (
    <section className="relative py-32 px-4 border-t border-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="text-xs font-mono tracking-[0.3em] text-muted-foreground/50 uppercase mb-4">
            System Architecture
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mb-4">
            Six Modules. One System.
          </h2>
          <p className="text-sm font-mono text-muted-foreground/60 max-w-lg mx-auto">
            Every module was built to spec for Electrathon competition. 
            Nothing is decorative — everything generates competitive advantage.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative p-6 rounded border border-border bg-card/20 hover:bg-card/50 hover:border-primary/25 transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/25 to-transparent transition-all duration-500" />

                {/* Tag + icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase">{cap.tag}</span>
                  <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <h3 className="text-sm font-sans font-bold text-foreground mb-2">{cap.title}</h3>
                <p className="text-xs font-mono text-muted-foreground/70 leading-relaxed mb-4">
                  {cap.desc}
                </p>

                {/* Metrics */}
                <div className="flex flex-wrap gap-1.5">
                  {cap.metrics.map(m => (
                    <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border bg-secondary/50 text-muted-foreground/60">
                      {m}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}