import React from 'react';
import { motion } from 'framer-motion';

export default function TelemetryGauge({ label, value, unit, max, icon: Icon, color, detail }) {
  const percentage = Math.min(100, (value / max) * 100);
  
  const colorClasses = {
    red: 'text-red-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    blue: 'text-blue-400',
    white: 'text-foreground',
  };

  const barClasses = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-400',
    white: 'bg-foreground',
  };

  return (
    <div className="p-4 rounded border border-border bg-card/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-3.5 h-3.5 ${colorClasses[color]}`} />}
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
        <span className={`text-2xl font-mono font-bold ${colorClasses[color]}`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        <span className="text-xs font-mono text-muted-foreground">{unit}</span>
      </div>

      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${barClasses[color]} rounded-full`}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}