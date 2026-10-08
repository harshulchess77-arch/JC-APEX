import React, { useState, useEffect } from 'react';
import { Save, Download, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MODES = [
  { id: 'aggressive', label: 'AGGRESSIVE', clr: '#ef4444' },
  { id: 'balanced',   label: 'BALANCED',   clr: '#eab308' },
  { id: 'conserve',   label: 'CONSERVE',   clr: '#22c55e' },
];

const modeClr = (m) => m === 'aggressive' ? '#ef4444' : m === 'conserve' ? '#22c55e' : '#eab308';

export default function StrategyPresets({ currentMode, onApplyMode }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', strategy_mode: currentMode || 'balanced', pit_lap: '', energy: '', tire: '', notes: '' });

  const load = async () => {
    try {
      const list = await base44.entities.StrategyPreset.list('-created_date', 50);
      setPresets(list || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      await base44.entities.StrategyPreset.create({
        name: form.name,
        strategy_mode: form.strategy_mode,
        pit_lap: form.pit_lap ? Number(form.pit_lap) : null,
        energy_target: form.energy ? Number(form.energy) : null,
        tire: form.tire || '',
        notes: form.notes || '',
      });
    } catch {}
    setForm({ name: '', strategy_mode: currentMode || 'balanced', pit_lap: '', energy: '', tire: '', notes: '' });
    setShowForm(false);
    load();
  };

  const apply = (p) => { onApplyMode?.(p.strategy_mode); };
  const remove = async (id) => { try { await base44.entities.StrategyPreset.delete(id); } catch {} load(); };

  return (
    <div className="rounded border border-white/[0.06] bg-[#101217] p-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Strategy Presets</span>
          <span className="text-[7px] font-mono text-white/20">{presets.length} saved</span>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-primary/25 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/20 transition-all">
          {showForm ? <><X className="w-3 h-3" /> CLOSE</> : <><Save className="w-3 h-3" /> SAVE CURRENT</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-3 p-3 rounded border border-white/[0.06] bg-white/[0.02] space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Preset Name</div>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wet Weather Cons"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
            <div>
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Strategy Mode</div>
              <div className="flex gap-1.5">
                {MODES.map(m => (
                  <button key={m.id} onClick={() => setForm({ ...form, strategy_mode: m.id })}
                    className={`flex-1 py-1.5 rounded text-[9px] font-display font-bold tracking-wider border transition-all ${form.strategy_mode === m.id ? '' : 'border-white/[0.06] text-white/25 hover:text-white/50'}`}
                    style={form.strategy_mode === m.id ? { color: m.clr, borderColor: `${m.clr}30`, background: `${m.clr}10` } : {}}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Pit Lap Target</div>
              <input type="number" value={form.pit_lap} onChange={e => setForm({ ...form, pit_lap: e.target.value })} placeholder="6"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
            <div>
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Energy Target %</div>
              <input type="number" value={form.energy} onChange={e => setForm({ ...form, energy: e.target.value })} placeholder="35"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
            <div className="col-span-2">
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Tire Choice</div>
              <input value={form.tire} onChange={e => setForm({ ...form, tire: e.target.value })} placeholder="Slicks / Intermediates / Wets"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
            <div className="col-span-2">
              <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-1">Notes</div>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Plan details…"
                className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-white/[0.03] text-white/70 font-mono text-[10px] focus:outline-none focus:border-primary/30 placeholder:text-white/10 resize-none" rows={2} />
            </div>
          </div>
          <button onClick={save}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded border border-green-400/40 bg-green-600 text-white text-[10px] font-display font-bold tracking-widest hover:bg-green-500 transition-all">
            <Save className="w-3.5 h-3.5" /> SAVE PRESET
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {loading ? (
          <span className="text-[9px] font-mono text-white/20">Loading…</span>
        ) : presets.length === 0 ? (
          <span className="text-[9px] font-mono text-white/20">No presets saved — click SAVE CURRENT to create one.</span>
        ) : presets.map(p => (
          <div key={p.id} className="flex-shrink-0 rounded border border-white/[0.06] bg-white/[0.02] p-2.5 w-52">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-display font-bold text-white/70 truncate">{p.name}</span>
              <button onClick={() => remove(p.id)} className="text-white/15 hover:text-primary transition-colors flex-shrink-0 ml-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: modeClr(p.strategy_mode) }} />
              <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: modeClr(p.strategy_mode) }}>{p.strategy_mode}</span>
            </div>
            <div className="text-[8px] font-mono text-white/25 space-y-0.5 mb-2">
              {p.pit_lap ? <div>Pit: <span className="text-white/45">L{p.pit_lap}</span></div> : null}
              {p.energy_target ? <div>Energy: <span className="text-white/45">{p.energy_target}%</span></div> : null}
              {p.tire ? <div>Tire: <span className="text-white/45">{p.tire}</span></div> : null}
              {p.fuel_config ? <div>Fuel: <span className="text-white/45">{p.fuel_config}</span></div> : null}
            </div>
            <button onClick={() => apply(p)}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-primary/25 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/20 transition-all">
              <Download className="w-3 h-3" /> LOAD
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}