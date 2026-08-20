import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

const problems = [
  'No live battery drain rate — just a guess',
  'Temperature spikes go undetected until failure',
  'Strategy calls made on instinct, not data',
  'No comms protocol — shouting from the pit wall',
  'Post-race data review is too late to help',
];

const solutions = [
  'Live drain rate, voltage curve & deficit projection',
  'Thermal model with time-to-critical countdown',
  'Oracle-generated strategy with confidence scoring',
  'F1-style pit-to-driver comms with command log',
  'Real-time decisions before failure happens',
];

export default function ProblemSolution() {
  return (
    <section className="relative py-32 px-4 border-t border-border/30">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="text-xs font-mono tracking-[0.3em] text-muted-foreground/50 uppercase mb-4">
            System Justification
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mb-4">
            Why Most Teams <span className="text-primary">Lose</span> Before Lap 3
          </h2>
          <p className="text-sm font-mono text-muted-foreground/60 max-w-lg mx-auto">
            Electrathon is a precision energy management sport disguised as a race. 
            The teams that win treat every data point as a competitive edge.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Problem column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded border border-border/60 bg-card/20 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <X className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="text-xs font-mono tracking-[0.2em] text-muted-foreground/50 uppercase">Without APEX</div>
                <div className="text-base font-sans font-bold text-foreground/80">Running Blind</div>
              </div>
            </div>
            <ul className="space-y-3">
              {problems.map((p, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 text-sm font-mono text-muted-foreground/70"
                >
                  <X className="w-3.5 h-3.5 text-red-500/60 mt-0.5 flex-shrink-0" />
                  {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Solution column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded border border-primary/20 bg-primary/5 p-6 glow-red-subtle"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-mono tracking-[0.2em] text-primary/60 uppercase">With APEX</div>
                <div className="text-base font-sans font-bold text-foreground">Full Tactical Control</div>
              </div>
            </div>
            <ul className="space-y-3">
              {solutions.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.15 }}
                  className="flex items-start gap-3 text-sm font-mono text-foreground/80"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  {s}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-sm font-mono text-muted-foreground/50 max-w-md mx-auto">
            JC APEX doesn't just display data — it <span className="text-foreground">interprets it, predicts on it, and acts on it</span> in real time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}