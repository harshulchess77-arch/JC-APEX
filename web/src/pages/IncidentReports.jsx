import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Plus, Trash2, CheckCircle } from 'lucide-react';

const INITIAL = [
  { id: 1, race: 'Round 8 — Metro Circuit', lap: 7,  driver: 'T. Obi',    type: 'CONTACT',  severity: 'MINOR',    penalty: '5s Add',     resolved: true,  notes: 'Contact with barrier at turn 3 exit. No damage. Continued race.' },
  { id: 2, race: 'Round 8 — Metro Circuit', lap: 11, driver: 'M. Santos',  type: 'BLOCKING', severity: 'WARNING',  penalty: 'Black+White', resolved: true,  notes: 'Impeded JC on back straight. Ruling: blocking under blue flag conditions.' },
  { id: 3, race: 'Round 7 — Riverside',     lap: 4,  driver: 'A. Park',    type: 'BATTERY',  severity: 'DNF',      penalty: 'None',        resolved: true,  notes: 'Sudden battery discharge. Vehicle retired safely. Investigation ongoing.' },
  { id: 4, race: 'Round 6 — Harbor',        lap: 2,  driver: 'L. Kovak',   type: 'SPIN',     severity: 'MINOR',    penalty: 'None',        resolved: true,  notes: 'Spun at chicane entrance. Self-recovered. Safety car not required.' },
];

const SEV_STYLE = {
  MINOR:   'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]',
  WARNING: 'border-[#FFB300]/30 bg-[#FFB300]/10 text-[#FFB300]',
  SERIOUS: 'border-primary/30 bg-primary/10 text-primary',
  DNF:     'border-primary/40 bg-primary/15 text-primary',
};

const TYPES = ['CONTACT', 'BLOCKING', 'BATTERY', 'SPIN', 'PENALTY', 'MECHANICAL', 'OTHER'];
const SEVERITIES = ['MINOR', 'WARNING', 'SERIOUS', 'DNF'];

const EMPTY_FORM = { race: '', lap: '', driver: '', type: 'CONTACT', severity: 'MINOR', penalty: '', notes: '' };

export default function IncidentReports() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState('ALL');

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const add = () => {
    if (!form.driver.trim()) return;
    setIncidents(prev => [{ ...form, id: Date.now(), lap: Number(form.lap) || 0, resolved: false }, ...prev]);
    setForm(EMPTY_FORM); setShowForm(false);
  };
  const resolve = (id) => setIncidents(prev => prev.map(i => i.id === id ? { ...i, resolved: true } : i));
  const remove = (id) => setIncidents(prev => prev.filter(i => i.id !== id));

  const filtered = filter === 'ALL' ? incidents : incidents.filter(i => i.severity === filter);

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <AlertTriangle className="w-4 h-4 text-[#FFB300]" />
          <span className="font-display font-black text-sm tracking-widest text-white">INCIDENT REPORTS</span>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', ...SEVERITIES].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[8px] font-mono tracking-wider transition-colors ${filter === f ? 'bg-primary/15 text-primary border border-primary/25' : 'text-white/20 hover:text-white/40'}`}>
              {f}
            </button>
          ))}
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/20 transition-colors ml-2 cursor-pointer">
            <Plus className="w-3 h-3" /> LOG INCIDENT
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 max-w-4xl mx-auto w-full space-y-3">
        {/* Form */}
        {showForm && (
          <div className="rounded border border-[#FFB300]/20 bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-[#FFB300]/80 mb-3 uppercase">New Incident Report</div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: 'Race / Event', key: 'race', placeholder: 'e.g. Round 8' },
                { label: 'Driver',       key: 'driver', placeholder: 'Driver name' },
                { label: 'Lap Number',   key: 'lap', placeholder: '7' },
                { label: 'Penalty',      key: 'penalty', placeholder: 'e.g. 5s Add' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">{f.label}</label>
                  <input value={form[f.key]} onChange={e => set(f.key)(e.target.value)} placeholder={f.placeholder}
                    className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#08090C] text-white/60 font-mono text-xs focus:outline-none placeholder:text-white/10" />
                </div>
              ))}
              <div>
                <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Type</label>
                <select value={form.type} onChange={e => set('type')(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#08090C] text-white/60 font-mono text-xs focus:outline-none">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[7px] font-mono text-white/20 mb-1 tracking-widest uppercase">Severity</label>
                <select value={form.severity} onChange={e => set('severity')(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#08090C] text-white/60 font-mono text-xs focus:outline-none">
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={2} placeholder="Incident description..."
              className="w-full px-2.5 py-2 mb-3 rounded border border-white/[0.06] bg-[#08090C] text-white/60 font-mono text-xs resize-none focus:outline-none placeholder:text-white/10" />
            <div className="flex gap-2">
              <button onClick={add} className="px-4 py-1.5 rounded bg-[#FFB300]/15 border border-[#FFB300]/30 text-[#FFB300] text-[9px] font-display font-bold tracking-widest hover:bg-[#FFB300]/25 transition-colors cursor-pointer">SUBMIT REPORT</button>
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded border border-white/10 text-white/25 text-[9px] font-mono hover:text-white/50 transition-colors cursor-pointer">CANCEL</button>
            </div>
          </div>
        )}

        {filtered.map(inc => (
          <div key={inc.id} className={`rounded border bg-[#101217] p-4 ${inc.resolved ? 'border-white/[0.06]' : 'border-[#FFB300]/30'}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                  <span className={`text-[8px] font-display font-bold tracking-widest px-2 py-0.5 rounded border ${SEV_STYLE[inc.severity]}`}>{inc.severity}</span>
                  <span className="text-[8px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5">{inc.type}</span>
                  <span className="text-sm font-display font-bold text-white/70">{inc.driver}</span>
                  {inc.resolved && <span className="text-[7px] font-mono text-[#10B981] flex items-center gap-1"><CheckCircle className="w-3 h-3" />RESOLVED</span>}
                </div>
                <div className="text-[8px] font-mono text-white/25 mb-2">
                  {inc.race} · Lap {inc.lap}{inc.penalty ? ` · Penalty: ${inc.penalty}` : ''}
                </div>
                <p className="text-[9px] font-mono text-white/40 leading-relaxed">{inc.notes}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!inc.resolved && (
                  <button onClick={() => resolve(inc.id)} className="px-2.5 py-1 rounded border border-[#10B981]/30 text-[#10B981] text-[8px] font-mono hover:bg-[#10B981]/10 transition-colors cursor-pointer">RESOLVE</button>
                )}
                <button onClick={() => remove(inc.id)} className="p-1.5 text-white/15 hover:text-primary transition-colors cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}