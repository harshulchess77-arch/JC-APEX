import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const EMPTY = {
  race_name: '',
  tire_pressure_front: '', tire_pressure_rear: '',
  suspension_front: '', suspension_rear: '',
  gear_ratio: '', motor_controller: '',
  camber_front: '', camber_rear: '',
  ride_height: '', ballast_position: '',
  notes: '',
};

function Field({ label, value, onChange, placeholder = '', type = 'text', unit = '' }) {
  return (
    <div>
      <label className="block text-[8px] font-mono tracking-widest text-white/25 uppercase mb-1">{label}{unit && <span className="text-white/15 ml-1">({unit})</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded border border-white/[0.06] bg-[#08090C] text-white/70 font-mono text-xs focus:outline-none focus:border-primary/30 transition-colors placeholder:text-white/10" />
    </div>
  );
}

export default function VehicleConfig() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data, error } = await supabase
        .from('vehicle_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching vehicle configs:', error);
      } else {
        setConfigs(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setForm({ ...EMPTY, ...data[0] });
        }
      }
      setLoading(false);
    };
    fetchConfigs();
  }, []);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    let updated;
    if (selectedId) {
      const { data, error } = await supabase
        .from('vehicle_configs')
        .update(payload)
        .eq('id', selectedId)
        .select()
        .single();
      if (error) {
        console.error('Error updating vehicle config:', error);
        setSaving(false);
        return;
      }
      updated = data;
      setConfigs(prev => prev.map(c => c.id === selectedId ? updated : c));
    } else {
      const { data, error } = await supabase
        .from('vehicle_configs')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('Error creating vehicle config:', error);
        setSaving(false);
        return;
      }
      updated = data;
      setConfigs(prev => [updated, ...prev]);
      setSelectedId(updated.id);
    }
    setForm({ ...EMPTY, ...updated });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const SECTIONS = [
    { title: 'RACE INFO', fields: [
      { label: 'Race / Event Name', key: 'race_name', placeholder: 'e.g. Round 3 — Speedway' },
    ]},
    { title: 'TIRES', fields: [
      { label: 'Front Pressure', key: 'tire_pressure_front', placeholder: '35', unit: 'PSI' },
      { label: 'Rear Pressure',  key: 'tire_pressure_rear',  placeholder: '34', unit: 'PSI' },
    ]},
    { title: 'SUSPENSION', fields: [
      { label: 'Front Spring Rate', key: 'suspension_front', placeholder: 'e.g. 200', unit: 'lb/in' },
      { label: 'Rear Spring Rate',  key: 'suspension_rear',  placeholder: 'e.g. 220', unit: 'lb/in' },
      { label: 'Front Camber', key: 'camber_front', placeholder: '-1.5', unit: '°' },
      { label: 'Rear Camber',  key: 'camber_rear',  placeholder: '-1.2', unit: '°' },
    ]},
    { title: 'DRIVETRAIN', fields: [
      { label: 'Gear Ratio',        key: 'gear_ratio',        placeholder: 'e.g. 6.5:1' },
      { label: 'Motor Controller',  key: 'motor_controller',  placeholder: 'e.g. Kelly KLS7245' },
    ]},
    { title: 'CHASSIS', fields: [
      { label: 'Ride Height',      key: 'ride_height',      placeholder: '45', unit: 'mm' },
      { label: 'Ballast Position', key: 'ballast_position', placeholder: 'e.g. Center-rear' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Settings className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">VEHICLE CONFIG</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[9px] font-display font-bold tracking-widest transition-all hover:bg-primary/20 disabled:opacity-50">
          {saved ? <><Check className="w-3 h-3" /> SAVED</> : saving ? '...' : <><Save className="w-3 h-3" /> SAVE CONFIG</>}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-3xl mx-auto space-y-6">
          {SECTIONS.map(sec => (
            <div key={sec.title} className="rounded border border-white/[0.06] bg-[#101217] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-[9px] font-display font-bold tracking-[0.2em] text-white/40 uppercase">{sec.title}</span>
              </div>
              <div className={`p-4 grid gap-4 ${sec.fields.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {sec.fields.map(f => (
                  <Field key={f.key} label={f.label} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} unit={f.unit} />
                ))}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div className="rounded border border-white/[0.06] bg-[#101217] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="text-[9px] font-display font-bold tracking-[0.2em] text-white/40 uppercase">SETUP NOTES</span>
            </div>
            <div className="p-4">
              <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={4}
                placeholder="Track observations, special configurations, engineer notes..."
                className="w-full px-3 py-2.5 rounded border border-white/[0.06] bg-[#08090C] text-white/70 font-mono text-xs resize-none focus:outline-none focus:border-primary/30 placeholder:text-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}