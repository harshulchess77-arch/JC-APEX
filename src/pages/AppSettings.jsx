import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, Check, Eye, EyeOff } from 'lucide-react';

const SECTIONS = [
  {
    title: 'DISPLAY PREFERENCES',
    fields: [
      { key: 'theme',           label: 'Interface Theme',       type: 'select', options: ['Dark (Default)', 'Ultra Dark', 'High Contrast'], default: 'Dark (Default)' },
      { key: 'telemetry_hz',    label: 'Telemetry Refresh Rate', type: 'select', options: ['20 Hz', '10 Hz', '5 Hz', '1 Hz'],              default: '20 Hz' },
      { key: 'font_size',       label: 'UI Font Size',           type: 'select', options: ['Small', 'Medium', 'Large'],                   default: 'Medium' },
      { key: 'show_animations', label: 'Enable Animations',     type: 'toggle', default: true },
      { key: 'show_oracle',     label: 'Show Oracle Overlay',   type: 'toggle', default: true },
    ]
  },
  {
    title: 'TELEMETRY API',
    fields: [
      { key: 'api_endpoint', label: 'Telemetry API Endpoint', type: 'text',     placeholder: 'https://api.example.com/telemetry', default: '' },
      { key: 'api_key',      label: 'API Key',                type: 'password', placeholder: 'sk-••••••••••••', default: '' },
      { key: 'device_id',    label: 'Device ID / CAN Bus ID', type: 'text',     placeholder: 'e.g. JC-001', default: '' },
    ]
  },
  {
    title: 'ORACLE ENGINE',
    fields: [
      { key: 'oracle_auto',      label: 'Auto Oracle Analysis',      type: 'toggle', default: true },
      { key: 'oracle_interval',  label: 'Oracle Check Interval',     type: 'select', options: ['Every 10s', 'Every 30s', 'Every 60s'], default: 'Every 10s' },
      { key: 'critical_alerts',  label: 'Critical Alert Popups',     type: 'toggle', default: true },
      { key: 'sound_alerts',     label: 'Audio Alert on Critical',   type: 'toggle', default: false },
    ]
  },
  {
    title: 'ACCOUNT',
    fields: [
      { key: 'team_name',   label: 'Team Name',         type: 'text', placeholder: 'e.g. JC Apex Racing', default: '' },
      { key: 'operator_id', label: 'Operator Call Sign', type: 'text', placeholder: 'e.g. PIT-ALPHA', default: '' },
    ]
  }
];

export default function AppSettings() {
  const navigate = useNavigate();
  const [values, setValues] = useState(() => {
    const init = {};
    SECTIONS.forEach(s => s.fields.forEach(f => { init[f.key] = f.default; }));
    return init;
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key, val) => setValues(v => ({ ...v, [key]: val }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">SETTINGS</span>
        </div>
        <button onClick={save}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest hover:bg-primary/20 transition-all">
          {saved ? <><Check className="w-3 h-3" /> SAVED</> : 'SAVE CHANGES'}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-2xl mx-auto space-y-5">
          {SECTIONS.map(sec => (
            <div key={sec.title} className="rounded border border-white/[0.06] bg-[#0e0e0e] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#0b0b0b]">
                <span className="text-[9px] font-display font-bold tracking-[0.2em] text-white/35 uppercase">{sec.title}</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {sec.fields.map(f => (
                  <div key={f.key} className="flex items-center justify-between px-4 py-3">
                    <label className="text-[10px] font-mono text-white/50">{f.label}</label>
                    {f.type === 'toggle' ? (
                      <button onClick={() => set(f.key, !values[f.key])}
                        className={`relative w-10 h-5 rounded-full transition-colors ${values[f.key] ? 'bg-primary' : 'bg-white/10'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${values[f.key] ? 'left-5.5' : 'left-0.5'}`}
                          style={{ left: values[f.key] ? '22px' : '2px' }} />
                      </button>
                    ) : f.type === 'select' ? (
                      <select value={values[f.key]} onChange={e => set(f.key, e.target.value)}
                        className="px-2.5 py-1.5 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30">
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'password' ? (
                      <div className="flex items-center gap-1">
                        <input type={showPwd ? 'text' : 'password'} value={values[f.key]}
                          onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                          className="px-2.5 py-1.5 w-52 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
                        <button onClick={() => setShowPwd(v => !v)} className="text-white/20 hover:text-white/50 transition-colors p-1">
                          {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <input type="text" value={values[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                        className="px-2.5 py-1.5 w-52 rounded border border-white/[0.06] bg-[#111] text-white/60 font-mono text-xs focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}