import React, { useState, useEffect } from 'react';
import { User, Shield, Trophy, Car, Plus, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDriverProfiles } from '@/lib/driverService';

export default function DriverProfilesTab() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await getDriverProfiles();
      setDrivers(data);
      if (data.length > 0) {
        setSelectedDriver(prev => (prev ? data.find(d => d.id === prev.id) || data[0] : data[0]));
      }
    } catch (err) {
      console.error('Failed to load drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  return (
    <div className="grid grid-cols-12 gap-3 h-full">
      {/* Driver List Roster (5 cols) */}
      <div className="col-span-4 flex flex-col gap-3">
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] font-display font-bold tracking-widest text-white/50 uppercase">
                Active Roster ({drivers.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={loadDrivers}
                title="Sync from Supabase"
                className="p-1 rounded text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-primary' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/drivers')}
                className="flex items-center gap-1 px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary text-[8px] font-mono font-bold tracking-wider hover:bg-primary/20 transition-all cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" /> MANAGE / NEW
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading && drivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-white/20 font-mono text-[9px]">
                <div className="w-4 h-4 border border-primary/40 border-t-primary rounded-full animate-spin mb-2" />
                Querying Supabase drivers...
              </div>
            ) : drivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-white/20">
                <User className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-[10px] font-mono">No driver profiles saved</p>
                <button
                  onClick={() => navigate('/drivers')}
                  className="mt-3 px-3 py-1 rounded border border-primary/30 text-primary text-[9px] font-mono tracking-widest hover:bg-primary/10 transition-colors"
                >
                  CREATE FIRST DRIVER
                </button>
              </div>
            ) : (
              drivers.map(d => {
                const isSelected = selectedDriver?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDriver(d)}
                    className={`w-full text-left p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary/40 bg-primary/8 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                        : 'border-white/[0.04] bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-black text-primary">#{d.number || '?'}</span>
                        <span className="text-xs font-display font-bold text-white truncate max-w-[130px]">{d.name}</span>
                      </div>
                      <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded border ${
                        d.status === 'Active'
                          ? 'border-green-500/30 text-green-400 bg-green-500/10'
                          : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                      }`}>
                        {d.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-white/30">
                      <span>{d.motor_type || 'Custom EV'}</span>
                      <span>{d.wins || 0}W · {d.races_entered || 0}R</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Driver Detail Telemetry & Setup Dossier (8 cols) */}
      <div className="col-span-8 flex flex-col gap-3">
        {selectedDriver ? (
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4 flex-1 flex flex-col overflow-y-auto">
            {/* Header info */}
            <div className="flex items-start justify-between pb-3 border-b border-white/[0.06] mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-display font-black text-white">{selectedDriver.name}</span>
                  <span className="text-lg font-mono font-black text-primary">#{selectedDriver.number}</span>
                  <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-green-500/30 text-green-400 bg-green-500/5 uppercase">
                    ● {selectedDriver.status || 'Active'}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-white/30 mt-1">
                  EV Kart Telemetry ID: {selectedDriver.id}
                </div>
              </div>

              <button
                onClick={() => navigate('/drivers')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>Edit In Full Studio</span>
                <ChevronRight className="w-3 h-3 text-primary" />
              </button>
            </div>

            {/* Performance Stats KPI Strip */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'WINS', value: selectedDriver.wins || 0, color: '#ef4444' },
                { label: 'PODIUMS', value: selectedDriver.podiums || 0, color: '#eab308' },
                { label: 'RACES', value: selectedDriver.races_entered || 0, color: '#60a5fa' },
                { label: 'BEST FINISH', value: selectedDriver.best_finish || '—', color: '#22c55e' },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded border border-white/[0.04] bg-white/[0.02] text-center">
                  <div className="text-[7px] font-mono tracking-widest text-white/20 uppercase mb-0.5">{s.label}</div>
                  <div className="text-base font-display font-black" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Biometrics & Physical */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded border border-white/[0.04] bg-white/[0.01]">
                <div className="text-[7px] font-mono text-white/20 uppercase">Driver Age</div>
                <div className="text-xs font-mono text-white/80 font-bold">{selectedDriver.age ? `${selectedDriver.age} yrs` : 'N/A'}</div>
              </div>
              <div className="p-2 rounded border border-white/[0.04] bg-white/[0.01]">
                <div className="text-[7px] font-mono text-white/20 uppercase">Weight Class</div>
                <div className="text-xs font-mono text-white/80 font-bold">{selectedDriver.weight_kg ? `${selectedDriver.weight_kg} kg` : 'N/A'}</div>
              </div>
              <div className="p-2 rounded border border-white/[0.04] bg-white/[0.01]">
                <div className="text-[7px] font-mono text-white/20 uppercase">Experience</div>
                <div className="text-xs font-mono text-white/80 font-bold">{selectedDriver.experience_years ? `${selectedDriver.experience_years} Seasons` : 'Rookie'}</div>
              </div>
            </div>

            {/* Vehicle Configuration Specs */}
            <div className="rounded border border-white/[0.04] bg-white/[0.02] p-3 mb-3">
              <div className="flex items-center gap-1.5 text-[8px] font-mono tracking-widest text-white/30 uppercase mb-2">
                <Car className="w-3 h-3 text-primary" />
                <span>Vehicle Mechanical Profile</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                <div><span className="text-white/20">MOTOR: </span><span className="text-white/70">{selectedDriver.motor_type || 'Stock'}</span></div>
                <div><span className="text-white/20">BATTERY: </span><span className="text-white/70">{selectedDriver.battery_capacity || '48V Standard'}</span></div>
                <div><span className="text-white/20">RATIO: </span><span className="text-white/70">{selectedDriver.gear_ratio || 'Default'}</span></div>
                <div><span className="text-white/20">TIRES: </span><span className="text-white/70">{selectedDriver.tire_type || 'Slicks'}</span></div>
                <div><span className="text-white/20">WHEEL: </span><span className="text-white/70">{selectedDriver.wheel_size || 'Standard'}</span></div>
                <div><span className="text-white/20">AERO: </span><span className="text-white/70">{selectedDriver.aero_config || 'Stock'}</span></div>
              </div>
            </div>

            {/* Driver Notes */}
            <div className="rounded border border-white/[0.04] bg-white/[0.02] p-3 flex-1">
              <div className="text-[8px] font-mono tracking-widest text-white/30 uppercase mb-1.5">
                Pit Engineer Notes &amp; Observations
              </div>
              <p className="text-[9px] font-mono text-white/50 leading-relaxed whitespace-pre-wrap">
                {selectedDriver.notes || selectedDriver.setup_notes || 'No notes logged for this driver. Click "Edit in Full Studio" to add driving telemetry preferences and race notes.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-8 flex-1 flex flex-col items-center justify-center text-center text-white/20">
            <User className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-xs font-mono">Select a driver on the left to inspect profiles and setup</p>
          </div>
        )}
      </div>
    </div>
  );
}
