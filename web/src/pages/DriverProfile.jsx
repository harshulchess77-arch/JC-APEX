import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, Trash2, ChevronLeft, User, Trophy, Settings2, StickyNote, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDriverProfiles, saveDriverProfile, deleteDriverProfile } from '@/lib/driverService';

const TABS = [
  { id: 'profile', label: 'PROFILE', icon: User },
  { id: 'history', label: 'RACE HISTORY', icon: Trophy },
  { id: 'setup', label: 'VEHICLE SETUP', icon: Settings2 },
  { id: 'notes', label: 'NOTES', icon: StickyNote },
];

const EMPTY_DRIVER = {
  name: '', number: '', age: '', weight_kg: '', experience_years: '',
  wins: 0, podiums: 0, races_entered: 0, best_finish: '', avg_lap_time: '',
  notes: '', motor_type: '', battery_capacity: '', gear_ratio: '',
  tire_type: '', wheel_size: '', aero_config: 'Stock', setup_notes: '', status: 'Active',
};

function StatInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded border border-border bg-card/40 text-foreground font-mono text-sm focus:outline-none focus:border-primary/40 focus:bg-card/70 transition-all placeholder:text-muted-foreground/20"
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded border border-border bg-card/40 text-foreground font-mono text-sm focus:outline-none focus:border-primary/40 transition-all"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function DriverProfile() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_DRIVER);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      const data = await getDriverProfiles();
      setDrivers(data);
      if (data.length > 0) {
        // If current selectedId still exists in list, keep it; else pick first
        const current = data.find(d => d.id === selectedId) || data[0];
        setSelectedId(current.id);
        setForm({ ...EMPTY_DRIVER, ...current });
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const selectDriver = (d) => {
    setSelectedId(d.id);
    setForm({ ...EMPTY_DRIVER, ...d });
    setErrorMsg(null);
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_DRIVER);
    setActiveTab('profile');
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.name.trim()) {
      setErrorMsg('Driver Full Name is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const savedDriver = await saveDriverProfile(form, selectedId);

      // Optimistic & Immediate State Update
      if (selectedId) {
        setDrivers(prev => prev.map(d => d.id === selectedId ? savedDriver : d));
      } else {
        setDrivers(prev => [savedDriver, ...prev]);
        setSelectedId(savedDriver.id);
      }

      setForm({ ...EMPTY_DRIVER, ...savedDriver });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save driver:', err);
      setErrorMsg(err.message || 'Failed to save driver profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteDriverProfile(selectedId);
      const remaining = drivers.filter(d => d.id !== selectedId);
      setDrivers(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
        setForm({ ...EMPTY_DRIVER, ...remaining[0] });
      } else {
        setSelectedId(null);
        setForm(EMPTY_DRIVER);
      }
    } catch (err) {
      console.error('Failed to delete driver:', err);
      setErrorMsg(err.message || 'Failed to delete driver.');
    }
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/pit')} className="flex items-center gap-1.5 text-muted-foreground/50 hover:text-foreground transition-colors text-xs font-mono">
              <ChevronLeft className="w-3.5 h-3.5" /> PIT CENTER
            </button>
            <span className="text-border/50">|</span>
            <span className="font-sans font-black text-lg">JC <span className="text-primary">APEX</span></span>
            <span className="text-xs font-mono text-muted-foreground/40 tracking-widest uppercase hidden sm:block">Driver Profiles</span>
          </div>
          <button onClick={handleNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-mono text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <Plus className="w-3 h-3" /> NEW DRIVER
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto w-full flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 border-r border-border bg-card/10 overflow-y-auto">
          <div className="p-3">
            <div className="text-[10px] font-mono text-muted-foreground/30 tracking-widest uppercase mb-2 px-1">
              Drivers ({drivers.length})
            </div>
            {loading ? (
              <div className="text-[11px] font-mono text-muted-foreground/30 text-center py-8">Loading...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-10">
                <User className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] font-mono text-muted-foreground/30">No drivers yet</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {drivers.map(d => (
                  <button key={d.id} onClick={() => selectDriver(d)}
                    className={`w-full text-left px-3 py-2.5 rounded border transition-all ${
                      selectedId === d.id ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:border-border hover:bg-secondary/20'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-primary font-bold">#{d.number || '?'}</span>
                      <span className="text-xs font-mono text-foreground truncate">{d.name}</span>
                    </div>
                    <div className={`text-[9px] font-mono mt-0.5 ${
                      d.status === 'Active' ? 'text-green-500/70' : d.status === 'Reserve' ? 'text-yellow-500/70' : 'text-muted-foreground/30'
                    }`}>{d.status || 'Active'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-sans font-black">
                {form.name ? form.name : <span className="text-muted-foreground/30">New Driver</span>}
                {form.number && <span className="text-primary ml-2">#{form.number}</span>}
              </h2>
              <p className="text-[11px] font-mono text-muted-foreground/40 mt-0.5">
                {form.wins} wins · {form.podiums} podiums · {form.races_entered} races
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedId && (
                <button onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs font-mono text-muted-foreground/50 hover:text-primary hover:border-primary/30 transition-all">
                  <Trash2 className="w-3 h-3" /> DELETE
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-all disabled:opacity-60 cursor-pointer">
                {saved ? <><Check className="w-3 h-3" /> SAVED</> : saving
                  ? <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                  : <><Save className="w-3 h-3" /> SAVE</>}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border mb-6">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono tracking-wider transition-all border-b-2 -mb-px ${
                    activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground'
                  }`}>
                  <Icon className="w-3 h-3" />{t.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatInput label="Full Name" value={form.name} onChange={set('name')} placeholder="Driver Name" />
                  <StatInput label="Car Number" value={form.number} onChange={set('number')} placeholder="e.g. 42" />
                  <SelectInput label="Status" value={form.status} onChange={set('status')} options={['Active', 'Reserve', 'Inactive']} />
                  <StatInput label="Age" value={form.age} onChange={set('age')} type="number" placeholder="18" />
                  <StatInput label="Weight (kg)" value={form.weight_kg} onChange={set('weight_kg')} type="number" placeholder="70" />
                  <StatInput label="Years Experience" value={form.experience_years} onChange={set('experience_years')} type="number" placeholder="3" />
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Career Wins', key: 'wins' },
                      { label: 'Podiums', key: 'podiums' },
                      { label: 'Races Entered', key: 'races_entered' },
                    ].map(f => (
                      <div key={f.key} className="p-4 rounded border border-border bg-card/20 text-center">
                        <div className="text-3xl font-mono font-black text-primary mb-1">{form[f.key] || 0}</div>
                        <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">{f.label}</div>
                        <input type="number" value={form[f.key]} onChange={e => set(f.key)(e.target.value)}
                          className="w-full mt-2 px-2 py-1 rounded border border-border bg-background/40 text-foreground font-mono text-xs text-center focus:outline-none focus:border-primary/40" />
                      </div>
                    ))}
                    <div className="p-4 rounded border border-border bg-card/20 text-center">
                      <div className="text-3xl font-mono font-black text-yellow-500 mb-1">{form.best_finish || '—'}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider mb-2">Best Finish</div>
                      <input value={form.best_finish} onChange={e => set('best_finish')(e.target.value)} placeholder="e.g. 1st"
                        className="w-full px-2 py-1 rounded border border-border bg-background/40 text-foreground font-mono text-xs text-center focus:outline-none focus:border-primary/40" />
                    </div>
                  </div>
                  <StatInput label="Average Lap Time" value={form.avg_lap_time} onChange={set('avg_lap_time')} placeholder="e.g. 4:32.1" />
                </div>
              )}

              {activeTab === 'setup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatInput label="Motor Type" value={form.motor_type} onChange={set('motor_type')} placeholder="e.g. MY1020" />
                  <StatInput label="Battery Capacity" value={form.battery_capacity} onChange={set('battery_capacity')} placeholder="e.g. 12Ah / 36V" />
                  <StatInput label="Gear Ratio" value={form.gear_ratio} onChange={set('gear_ratio')} placeholder="e.g. 6.5:1" />
                  <StatInput label="Tire Type" value={form.tire_type} onChange={set('tire_type')} placeholder="e.g. Kenda K40" />
                  <StatInput label="Wheel Size (in)" value={form.wheel_size} onChange={set('wheel_size')} placeholder="e.g. 26" />
                  <SelectInput label="Aero Configuration" value={form.aero_config} onChange={set('aero_config')} options={['Stock', 'Low Drag', 'High Downforce', 'Custom']} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider mb-1.5">Setup Notes</label>
                    <textarea value={form.setup_notes} onChange={e => set('setup_notes')(e.target.value)} rows={4}
                      placeholder="Suspension settings, motor controller tuning, special configurations..."
                      className="w-full px-3 py-2.5 rounded border border-border bg-card/40 text-foreground font-mono text-sm resize-none focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/20" />
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider mb-1.5">
                    Driver Notes &amp; Race-Day Observations
                  </label>
                  <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={12}
                    placeholder="Driving style notes, communication preferences, known strengths, weaknesses, medical considerations..."
                    className="w-full px-3 py-2.5 rounded border border-border bg-card/40 text-foreground font-mono text-sm resize-none focus:outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/20" />
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}