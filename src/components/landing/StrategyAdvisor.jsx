import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Target, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

const recommendations = [
  {
    id: 'deficit',
    title: 'Energy Deficit Approaching',
    severity: 'HIGH',
    tag: 'BATTERY',
    desc: 'At current drain rate of 2.3%/min, battery will reach 10% critical threshold 0.4 laps before finish. Projected deficit: 1.8% short.',
    action: 'Reduce pace by 8%. Switch to CONSERVE. Oracle projects +3.4% battery margin recovery over next 2 laps.',
    confidence: 88,
    impact: '2.3 laps',
    trend: 'down',
    borderColor: 'border-primary/30',
    bgColor: 'bg-primary/5',
    textColor: 'text-primary',
    iconComp: AlertTriangle,
  },
  {
    id: 'push',
    title: 'Push Window Detected',
    severity: 'OPPORTUNITY',
    tag: 'STRATEGY',
    desc: 'Battery at 72%, thermal at 34°C — both well within optimal. Efficiency is 81%. Energy margin supports 3-lap aggressive window.',
    action: 'Enable AGGRESSIVE mode. Oracle calculates +4.2 sec per lap gain. Window closes if battery drops below 55%.',
    confidence: 74,
    impact: '3 laps',
    trend: 'up',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/5',
    textColor: 'text-green-500',
    iconComp: CheckCircle2,
  },
  {
    id: 'thermal',
    title: 'Thermal Gradient Elevated',
    severity: 'MONITOR',
    tag: 'THERMAL',
    desc: 'Motor temp rising at +1.8°C/min. At this trajectory, 75°C critical threshold reached in 7.2 minutes. No action yet required.',
    action: 'Set thermal alert at 65°C. Reduce motor load by 5% if rise rate exceeds +2.5°C/min. Oracle will auto-alert.',
    confidence: 67,
    impact: '7.2 min',
    trend: 'up',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/5',
    textColor: 'text-yellow-500',
    iconComp: AlertTriangle,
  },
];

export default function StrategyAdvisor() {
  const [selected, setSelected] = useState('deficit');

  const active = recommendations.find(r => r.id === selected);

  return (
    <section className="relative py-32 px-4 border-t border-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <div className="text-xs font-mono tracking-[0.3em] text-primary/80 uppercase mb-4">
            Oracle Strategy Advisor
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mb-4">
            Not Just Data. <span className="text-primary">Decisions.</span>
          </h2>
          <p className="text-sm font-mono text-muted-foreground/60 max-w-xl mx-auto">
            Every Oracle recommendation includes the full reasoning chain: what the data says, 
            what it means, what to do, and how confident the model is — so the team makes 
            fast decisions with full context.
          </p>
        </motion.div>

        <div className="mt-12 grid lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Selector */}
          <div className="space-y-2">
            {recommendations.map(rec => {
              const Icon = rec.iconComp;
              return (
                <button
                  key={rec.id}
                  onClick={() => setSelected(rec.id)}
                  className={`w-full text-left p-3.5 rounded border transition-all ${
                    selected === rec.id
                      ? `${rec.borderColor} ${rec.bgColor}`
                      : 'border-border bg-card/20 hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${selected === rec.id ? rec.textColor : 'text-muted-foreground/50'}`} />
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${selected === rec.id ? rec.textColor : 'text-muted-foreground/50'}`}>
                      {rec.severity}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/30 ml-auto">{rec.tag}</span>
                  </div>
                  <div className={`text-xs font-sans font-semibold ${selected === rec.id ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                    {rec.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:col-span-2 rounded border p-5 ${active.borderColor} ${active.bgColor}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-[10px] font-mono tracking-widest uppercase mb-1 ${active.textColor} opacity-70`}>
                    {active.tag} · {active.severity}
                  </div>
                  <div className="text-base font-sans font-bold text-foreground">{active.title}</div>
                </div>
                {active.trend === 'up'
                  ? <TrendingUp className={`w-5 h-5 ${active.textColor}`} />
                  : <TrendingDown className={`w-5 h-5 ${active.textColor}`} />
                }
              </div>

              {/* Situation */}
              <div className="mb-4">
                <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-1.5">◆ SITUATION</div>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">{active.desc}</p>
              </div>

              {/* Oracle action */}
              <div className="mb-4">
                <div className={`text-[10px] font-mono uppercase tracking-widest mb-1.5 ${active.textColor} opacity-70`}>◆ ORACLE RECOMMENDATION</div>
                <p className={`text-sm font-mono font-semibold ${active.textColor} leading-relaxed`}>{active.action}</p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-5 mb-4 text-xs font-mono text-muted-foreground/50">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  <span>Confidence</span>
                  <span className={`font-bold ${active.textColor}`}>{active.confidence}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Impact in</span>
                  <span className={`font-bold ${active.textColor}`}>{active.impact}</span>
                </div>
              </div>

              <button className={`w-full flex items-center justify-center gap-2 py-3 rounded border ${active.borderColor} text-xs font-mono font-bold tracking-wider uppercase ${active.textColor} hover:opacity-80 transition-opacity`}>
                APPLY STRATEGY
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}