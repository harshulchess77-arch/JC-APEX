import React from 'react';

export function StatusChip({ label, variant = 'default' }) {
  const variants = {
    default: 'border-white/20 bg-white/5 text-white/40',
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    primary: 'border-primary/30 bg-primary/10 text-primary',
    demo: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[7px] font-mono ${variants[variant]}`}>
      {label}
    </div>
  );
}
