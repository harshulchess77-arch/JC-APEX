import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MODES = [
  { id: 'aggressive', label: 'AGGRESSIVE', clr: '#ef4444' },
  { id: 'balanced', label: 'BALANCED', clr: '#eab308' },
  { id: 'conserve', label: 'CONSERVE', clr: '#22c55e' },
];

export default function TireFuelPresets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', tire: '', battery_config: '', strategy_mode: 'balanced', notes: '' });

  const load = async () => {
    try { const list = await base44.entities.StrategyPreset.list('-created_date', 50); setPresets(list || []); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      await base44.entities.StrategyPreset.create({
        name: form.name,
        tire: form.tire || '',
        battery_config: form.battery_config || '',
        strategy_mode: form.strategy_mode,
        notes: form.notes || '',
      });
    } catch {}
    setForm({ name: '', tire: '', battery_config: '', strategy_mode: 'balanced', notes: '' });
    setShowForm(false);
    load();
  };

  const remove = async (id) => { try { await base44.entities.StrategyPreset.delete(id); } catch {} load(); };

  return (
    <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Tire &amp; Fuel Presets</span>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/25 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/20 transition-all">
          {showForm ? <><X className="w-3 h-3" /> CLOSE</> : <><Plus className="w-3 h-3" /> NEW PRESET</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-3 p-3 rounded border border-white/[0.06] bg-white/[0.02] space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Preset Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Soft Slicks + Lean Fuel"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
            <div>
              <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Strategy Mode</label>
              <div className="flex gap-1.5">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setForm({ ...form, strategy_mode: m.id })}
                    className={`flex-1 py-1.5 rounded text-[8px] font-display font-bold tracking-wider border transition-all ${form.strategy_mode === m.id ? '' : 'border-white/[0.06] text-white/25'}`}
                    style={form.strategy_mode === m.id ? { color: m.clr, borderColor: `${m.clr}30`, background: `${m.clr}10` } : {}}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Tire Configuration</label>
              <input value={form.tire} onChange={e => setForm({ ...form, tire: e.target.value })} placeholder="Slicks · 34 PSI"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
            <div>
              <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Fuel Configuration</label>
              <input value={form.fuel_config} onChange={e => setForm({ ...form, fuel_config: e.target.value })} placeholder="Lean · 5.5%/lap target"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notes..."
            className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs resize-none focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
          <button onClick={save}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-primary/20 border border-primary/30 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/30 transition-colors">
            <Save className="w-3 h-3" /> SAVE PRESET
          </button>
          <p className="text-[8px] font-mono text-white/25">Saved presets become instantly loadable from the Pit Center Strategy tab during a race.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {loading ? (
          <span className="text-[9px] font-mono text-white/20">Loading…</span>
        ) : presets.length === 0 ? (
          <span className="text-[9px] font-mono text-white/20 col-span-2">No tire/fuel presets saved yet.</span>
        ) : presets.map(p => {
          const m = MODES.find(x => x.id === p.strategy_mode) || MODES[1];
          return (
            <div key={p.id} className="rounded border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display font-bold text-white/70 truncate">{p.name}</span>
                <button onClick={() => remove(p.id)} className="text-white/15 hover:text-primary"><Trash2 className="w-3 h-3" /></button>
              </div>
              <div className="text-[8px] font-mono text-white/30 space-y-0.5 mb-1.5">
                <div>Tire: <span className="text-white/50">{p.tire || '—'}</span></div>
                <div>Fuel: <span className="text-white/50">{p.fuel_config || '—'}</span></div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.clr }} />
                <span className="text-[7px] font-mono uppercase tracking-wider" style={{ color: m.clr }}>{p.strategy_mode}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}