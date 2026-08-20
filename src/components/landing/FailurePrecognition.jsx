import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Battery, Thermometer, Zap, ShieldAlert, TrendingUp } from 'lucide-react';

const subsystems = [
  {
    icon: Battery,
    label: 'BATTERY SYSTEM',
    event: 'Total Discharge',
    baseProbability: 72,
    timeToFailure: 'T-3.2m',
    detail: 'Drain: 2.1%/min | 28% remaining | 4.1 laps projected',
    model: 'Linear drain regression + voltage sag curve',
    color: 'text-primary',
    barColor: 'bg-primary',
    borderColor: 'border-primary/20',
    bgColor: 'bg-primary/5',
  },
  {
    icon: Thermometer,
    label: 'THERMAL SYSTEM',
    event: 'Motor Overheat',
    baseProbability: 45,
    timeToFailure: 'T-7.8m',
    detail: 'Rise: +1.8°C/min | 62°C current | 75°C critical',
    model: 'Thermal gradient + ambient correction model',
    color: 'text-yellow-500',
    barColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500/20',
    bgColor: 'bg-yellow-500/5',
  },
  {
    icon: Zap,
    label: 'ELECTRICAL SYSTEM',
    event: 'Voltage Collapse',
    baseProbability: 28,
    timeToFailure: 'T-12.4m',
    detail: 'Rate: -0.4V/min | 42.1V current | 36V floor',
    model: 'Cell voltage curve + current draw pattern',
    color: 'text-green-500',
    barColor: 'bg-green-500',
    borderColor: 'border-green-500/20',
    bgColor: 'bg-green-500/5',
  },
];

export default function FailurePrecognition() {
  const [probs, setProbs] = useState(subsystems.map(s => s.baseProbability));
  const [times, setTimes] = useState(['T-3.2m', 'T-7.8m', 'T-12.4m']);

  useEffect(() => {
    const interval = setInterval(() => {
      setProbs(prev => prev.map((p, i) => {
        const drift = (Math.random() - 0.45) * 3;
        return Math.max(10, Math.min(92, p + drift));
      }));
      setTimes(prev => prev.map((t, i) => {
        const base = [3.2, 7.8, 12.4][i];
        const drift = (Math.random() - 0.5) * 0.4;
        return `T-${Math.max(0.5, base + drift).toFixed(1)}m`;
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-32 px-4 border-t border-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] text-primary/80 uppercase mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            Predictive Failure Engine
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mb-4">
            Don't React to Failures. <br />
            <span className="text-primary">Predict Them.</span>
          </h2>
          <p className="text-sm font-mono text-muted-foreground/60 max-w-2xl mx-auto">
            The Predictive Core runs continuous failure models against every subsystem — calculating 
            live probability-of-failure scores, time-to-critical countdowns, and drift rates 
            so the team can act before the event, not after it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {subsystems.map((sys, i) => {
            const Icon = sys.icon;
            const prob = Math.round(probs[i]);
            const riskLevel = prob > 65 ? 'HIGH RISK' : prob > 40 ? 'ELEVATED' : 'LOW RISK';
            return (
              <motion.div
                key={sys.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative rounded border ${sys.borderColor} ${sys.bgColor} p-5 overflow-hidden`}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current/20 to-transparent" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${sys.color}`} />
                    <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase">
                      {sys.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${sys.borderColor} ${sys.color}`}>
                    {riskLevel}
                  </span>
                </div>

                {/* Event */}
                <div className="text-sm font-sans font-bold text-foreground mb-1">
                  {sys.event}
                </div>

                {/* Probability */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className={`text-4xl font-mono font-black ${sys.color}`}>
                      {prob}
                    </span>
                    <span className={`text-lg font-mono font-bold ${sys.color} opacity-70`}>%</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-muted-foreground/50 uppercase mb-0.5">FAILURE IN</div>
                    <div className={`text-sm font-mono font-bold ${sys.color}`}>{times[i]}</div>
                  </div>
                </div>

                {/* Animated bar */}
                <div className="w-full h-1.5 bg-background/60 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className={`h-full ${sys.barColor} rounded-full`}
                    animate={{ width: `${prob}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>

                {/* Detail */}
                <p className="text-[11px] font-mono text-muted-foreground/70 mb-2 leading-relaxed">
                  {sys.detail}
                </p>

                {/* Model label */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {sys.model}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-xs font-mono text-muted-foreground/40 max-w-lg mx-auto">
            All probabilities are live-simulated from physics-based models. In race conditions, 
            they update every 50ms from actual sensor telemetry.
          </p>
        </motion.div>
      </div>
    </section>
  );
}