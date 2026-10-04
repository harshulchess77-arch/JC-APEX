import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function DriverCommandLink() {
  const [latest, setLatest] = useState(null);

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const list = await base44.entities.RaceMessage.list('-created_date', 1);
        setLatest((list || [])[0] || null);
      } catch {}
      unsub = base44.entities.RaceMessage.subscribe((event) => {
        if (event.type === 'create') setLatest(event.data);
        if (event.type === 'update') setLatest(prev => (prev && prev.id === event.data.id ? event.data : prev));
      });
    })();
    return () => unsub?.();
  }, []);

  const clr = latest?.status === 'Acknowledged' ? '#22c55e' : latest?.status === 'Delivered' ? '#3b82f6' : '#eab308';

  return (
    <div className="border-t border-white/[0.04] pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[7px] font-mono text-white/15 tracking-widest">DIGITAL PAGER</span>
        <span className="text-[7px] font-mono text-green-400">● LINK</span>
      </div>
      {latest ? (
        <div className="rounded border px-2 py-1.5" style={{ borderColor: `${clr}40`, background: `${clr}10` }}>
          <div className="text-[8px] font-mono text-white/30">LAST CMD</div>
          <div className="text-[10px] font-display font-bold" style={{ color: clr }}>{latest.commandText}</div>
          <div className="text-[7px] font-mono mt-0.5" style={{ color: clr }}>{latest.status?.toUpperCase()}</div>
        </div>
      ) : (
        <div className="text-[8px] font-mono text-white/15 text-center py-2">No commands</div>
      )}
    </div>
  );
}