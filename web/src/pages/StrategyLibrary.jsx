import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Trash2, Check } from 'lucide-react';

const INITIAL_TEMPLATES = [
  { id: 1, name: 'Wet Weather Conservative', condition: 'RAIN', strategy: 'conserve', description: 'Reduced speed, maximum energy efficiency. Avoid wheel-spin. Target 60% throttle max.', tire_pressure: '28 PSI', gear_ratio: '5.8:1', tags: ['WET', 'SAFE'], active: false },
  { id: 2, name: 'Dry Track Aggressive',     condition: 'DRY',  strategy: 'aggressive', description: 'Full push from lap 1. High throttle, monitor battery closely. Pit on lap 6.', tire_pressure: '36 PSI', gear_ratio: '7.0:1', tags: ['DRY', 'ATTACK'], active: true },
  { id: 3, name: 'Hot Weather Thermal Mgmt', condition: 'HOT',  strategy: 'balanced',   description: 'Prioritize cooling. Cap speed at 85% to prevent thermal runaway. Conserve after lap 8.', tire_pressure: '34 PSI', gear_ratio: '6.5:1', tags: ['HEAT', 'THERMAL'], active: false },
  { id: 4, name: 'Short Sprint Max Attack',  condition: 'ANY',  strategy: 'aggressive', description: 'Races under 10 laps only. Push every lap. No energy saving required.', tire_pressure: '37 PSI', gear_ratio: '7.2:1', tags: ['SPRINT', 'SHORT'], active: false },
  { id: 5, name: 'Endurance Saver',          condition: 'ANY',  strategy: 'conserve',   description: '15+ laps. Budget 5.5% battery per lap. Switch to push only after lap 12.', tire_pressure: '33 PSI', gear_ratio: '6.2:1', tags: ['LONG', 'ENDURANCE'], active: false },
];

const STRAT_COLOR = { aggressive: '#ef4444', balanced: '#eab308', conserve: '#22c55e' };
const COND_COLOR  = { RAIN: '#60a5fa', DRY: '#eab308', HOT: '#ef4444', ANY: '#a78bfa' };

export default function StrategyLibrary() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [showForm, setShowForm] = useState(false);
  const [newT, setNewT] = useState({ name: '', condition: 'DRY', strategy: 'balanced', description: '', tire_pressure: '', gear_ratio: '' });

  const activate = (id) => setTemplates(prev => prev.map(t => ({ ...t, active: t.id === id })));
  const remove = (id) => setTemplates(prev => prev.filter(t => t.id !== id));
  const addTemplate = () => {
    if (!newT.name.trim()) return;
    setTemplates(prev => [...prev, { ...newT, id: Date.now(), tags: [newT.condition], active: false }]);
    setNewT({ name: '', condition: 'DRY', strategy: 'balanced', description: '', tire_pressure: '', gear_ratio: '' });
    setShowForm(false);
  };

  const s = k => v => setNewT(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">STRATEGY LIBRARY</span>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/20 transition-colors">
          <Plus className="w-3 h-3" /> NEW TEMPLATE
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4 max-w-5xl mx-auto w-full space-y-4">
        {/* Add form */}
        {showForm && (
          <div className="rounded border border-primary/20 bg-primary/5 p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-primary/70 mb-3 uppercase">New Template</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: 'Template Name', key: 'name', placeholder: 'e.g. Wet Weather Conservative' },
                { label: 'Tire Pressure', key: 'tire_pressure', placeholder: '35 PSI' },
                { label: 'Gear Ratio',    key: 'gear_ratio',    placeholder: '6.5:1' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">{f.label}</label>
                  <input value={newT[f.key]} onChange={e => s(f.key)(e.target.value)} placeholder={f.placeholder}
                    className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
                </div>
              ))}
              <div>
                <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Strategy Mode</label>
                <select value={newT.strategy} onChange={e => s('strategy')(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none">
                  {['aggressive', 'balanced', 'conserve'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <textarea value={newT.description} onChange={e => s('description')(e.target.value)} rows={2} placeholder="Strategy notes..."
              className="w-full px-2.5 py-1.5 mb-3 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs resize-none focus:outline-none placeholder:text-white/10" />
            <div className="flex gap-2">
              <button onClick={addTemplate} className="px-4 py-1.5 rounded bg-primary/20 border border-primary/30 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/30 transition-colors">
                SAVE TEMPLATE
              </button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded border border-white/10 text-white/25 text-[9px] font-mono hover:text-white/50 transition-colors">
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Templates */}
        <div className="grid grid-cols-1 gap-3">
          {templates.map(t => (
            <div key={t.id} className={`rounded border bg-[#0e0e0e] p-4 transition-all ${t.active ? 'border-primary/30 bg-primary/3' : 'border-white/[0.06]'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-sm font-display font-bold text-white/80">{t.name}</span>
                    {t.active && <span className="text-[7px] font-display font-bold tracking-widest px-2 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400">ACTIVE</span>}
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: COND_COLOR[t.condition], background: `${COND_COLOR[t.condition]}15` }}>{t.condition}</span>
                    <span className="text-[8px] font-mono font-bold" style={{ color: STRAT_COLOR[t.strategy] }}>{t.strategy.toUpperCase()}</span>
                  </div>
                  <p className="text-[9px] font-mono text-white/35 mb-2 leading-relaxed">{t.description}</p>
                  <div className="flex items-center gap-4 text-[8px] font-mono text-white/25">
                    <span>Tire: <span className="text-white/50">{t.tire_pressure}</span></span>
                    <span>Gear: <span className="text-white/50">{t.gear_ratio}</span></span>
                    {t.tags.map(tag => <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-white/30">{tag}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => activate(t.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded border text-[9px] font-display font-bold tracking-widest transition-all ${
                      t.active ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-white/10 text-white/25 hover:border-primary/25 hover:text-primary'
                    }`}>
                    <Check className="w-3 h-3" /> {t.active ? 'LOADED' : 'LOAD'}
                  </button>
                  <button onClick={() => remove(t.id)} className="p-1.5 text-white/15 hover:text-primary transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}