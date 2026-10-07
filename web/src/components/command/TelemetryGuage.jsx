import React from 'react';
import { motion } from 'framer-motion';

export default function TelemetryGauge({ label, value, unit, max, icon: Icon, color, detail }) {
  // Defensive fallbacks for rapid 5 Hz telemetry updates
  const safeValue = value ?? 0;
  const safeMax = max ?? 100;
  const safeColor = color ?? 'green';
  const percentage = Math.min(100, (safeValue / safeMax) * 100);

  const colorClasses = {
    red: 'text-[#FF0033]',
    green: 'text-[#00FF66]',
    yellow: 'text-[#FFD600]',
    blue: 'text-[#60a5fa]',
    white: 'text-foreground',
  };

  const barClasses = {
    red: 'bg-[#FF0033]',
    green: 'bg-[#00FF66]',
    yellow: 'bg-[#FFD600]',
    blue: 'bg-[#60a5fa]',
    white: 'bg-foreground',
  };

  return (
    <div className="p-4 rounded border border-border bg-card/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-3.5 h-3.5 ${colorClasses[safeColor]}`} />}
          <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
        </div>
        {detail && (
          <span className="text-xs font-mono text-muted-foreground/60">
            {detail}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className={`text-2xl font-mono font-bold ${colorClasses[safeColor]}`}>
          {typeof safeValue === 'number' ? safeValue.toFixed(1) : safeValue}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{unit}</span>
      </div>

      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${barClasses[safeColor]} rounded-full`}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}