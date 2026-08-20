import React from 'react';
import { Gauge } from 'lucide-react';

const strategies = [
  { id: 'aggressive', label: 'AGGRESSIVE', desc: 'Max power, high drain', color: 'border-primary/40 bg-primary/10 text-primary' },
  { id: 'balanced', label: 'BALANCED', desc: 'Optimal efficiency', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500' },
  { id: 'conserve', label: 'CONSERVE', desc: 'Max range, low power', color: 'border-green-500/40 bg-green-500/10 text-green-500' },
];

export default function StrategyPanel({ activeStrategy, onStrategyChange }) {
  return (
    <div className="rounded border border-border bg-card/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase font-bold">
          Strategy Engine
        </span>
      </div>

      <div className="space-y-2">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => onStrategyChange(s.id)}
            className={`w-full text-left p-3 rounded border text-xs font-mono transition-all ${
              activeStrategy === s.id
                ? `${s.color} font-bold`
                : 'border-border bg-card/20 text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            <div className="font-bold tracking-wider">{s.label}</div>
            <div className="opacity-60 mt-0.5">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}