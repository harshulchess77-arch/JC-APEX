import React from 'react';
import { Flag } from 'lucide-react';

const flags = [
  { id: 'green', label: 'GREEN', desc: 'All clear', colorClass: 'border-green-500/40 bg-green-500/10 text-green-500' },
  { id: 'yellow', label: 'YELLOW', desc: 'Caution', colorClass: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500' },
  { id: 'red', label: 'RED', desc: 'Stop', colorClass: 'border-primary/40 bg-primary/10 text-primary' },
  { id: 'black', label: 'BLACK', desc: 'Override', colorClass: 'border-foreground/40 bg-foreground/10 text-foreground' },
];

export default function FlagPanel({ activeFlag, onFlagChange }) {
  return (
    <div className="rounded border border-border bg-card/30 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flag className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono tracking-[0.2em] text-muted-foreground uppercase font-bold">
          Flag System
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {flags.map((f) => (
          <button
            key={f.id}
            onClick={() => onFlagChange(f.id)}
            className={`p-2.5 rounded border text-xs font-mono text-center transition-all ${
              activeFlag === f.id
                ? `${f.colorClass} font-bold`
                : 'border-border bg-card/20 text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            <div className="font-bold tracking-wider">{f.label}</div>
            <div className="opacity-60 text-[10px] mt-0.5">{f.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}