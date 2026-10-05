import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Cpu, Activity, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

const ROLES = [
  {
    id: 'pit',
    label: 'PIT ENGINEER',
    desc: 'Full command access — telemetry, Oracle, strategy, comms (PEGATSA@55)',
    icon: Cpu,
    route: '/pit',
    color: 'text-primary',
    activeBorder: 'border-primary/40',
    activeBg: 'bg-primary/5',
  },
  {
    id: 'driver',
    label: 'DRIVER HUD',
    desc: 'Heads-up display — speed, battery, Oracle alerts, pit comms (DGATSA@55)',
    icon: Activity,
    route: '/driver',
    color: 'text-green-500',
    activeBorder: 'border-green-500/40',
    activeBg: 'bg-green-500/5',
  },
  {
    id: 'director',
    label: 'RACE DIRECTOR',
    desc: 'Overview & flag control — system health, Oracle log, elevated pit access (RDGATSA@55)',
    icon: Flag,
    route: '/pit',
    color: 'text-yellow-500',
    activeBorder: 'border-yellow-500/40',
    activeBg: 'bg-yellow-500/5',
  },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = usePasscodeAuth();
  const [selected, setSelected] = useState('pit');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.unauthorized) {
      setError('Access to Driver HUD restricted. Requires Driver (DGATSA@55) or Race Director (RDGATSA@55) authentication.');
    }
  }, [location.state]);

  const handleEnter = async () => {
    setError('');
    if (!pin) { setError('Enter access password'); return; }
    const trimmed = pin.trim();

    // Authenticate via universal login
    const result = login(selected, trimmed);
    if (!result.success) {
      setError(`Invalid password for ${ROLES.find(r => r.id === selected)?.label || 'selected role'}. Enter a valid role passcode or DEMO@55`);
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    navigate(result.route || '/pit');
  };

  const selectedRole = ROLES.find(r => r.id === selected);

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Corner decorations */}
      <div className="fixed top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-primary/15 pointer-events-none" />
      <div className="fixed top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-primary/15 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-primary/10 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-primary/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/4 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-red" />
            <span className="text-[10px] font-mono tracking-[0.3em] text-primary/80 uppercase">Secure Access · v2.4.1</span>
          </div>
          <h1 className="font-sans font-black text-6xl mb-1">
            JC <span className="text-primary glow-red-text">APEX</span>
          </h1>
          <p className="text-[11px] font-mono text-muted-foreground/40 tracking-[0.3em] uppercase">
            Race Intelligence System
          </p>
        </div>

        {/* Role selector */}
        <div className="mb-5">
          <div className="text-[10px] font-mono text-muted-foreground/35 tracking-[0.25em] uppercase mb-3 px-1">
            Select Operator Role
          </div>
          <div className="space-y-2">
            {ROLES.map(role => {
              const Icon = role.icon;
              const isActive = selected === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelected(role.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded border transition-all duration-200 ${
                    isActive
                      ? `${role.activeBorder} ${role.activeBg}`
                      : 'border-border bg-card/20 hover:bg-secondary/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? 'bg-secondary/80' : 'bg-secondary/40'
                  }`}>
                    <Icon className={`w-4.5 h-4.5 ${isActive ? role.color : 'text-muted-foreground/50'}`} style={{ width: 18, height: 18 }} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className={`text-[11px] font-mono font-bold tracking-wider mb-0.5 ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                      {role.label}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/35 leading-tight">{role.desc}</div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 transition-all ${
                    isActive ? `${role.color.replace('text-', 'border-').replace('500', '500')} bg-current` : 'border-border'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN */}
        <div className="mb-5">
          <div className="text-[10px] font-mono text-muted-foreground/35 tracking-[0.25em] uppercase mb-3 px-1">
            Access Password
          </div>
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEnter()}
              placeholder="Enter password..."
              className="w-full px-4 py-3.5 rounded border border-border bg-card/20 text-foreground font-mono text-base placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/40 focus:bg-card/40 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            {error
              ? <p className="text-[11px] font-mono text-primary">{error}</p>
              : <span />
            }
            <p className="text-[10px] font-mono text-muted-foreground/35">
              {pin.trim().toUpperCase() === 'DEMO@55' ? '⚡ Simulated Demo Mode' : 'Live Hardware Mode'}
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleEnter}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2.5 py-4 font-mono text-sm font-bold tracking-wider uppercase rounded transition-all disabled:opacity-60 cursor-pointer ${
            selected === 'pit' ? 'bg-primary text-primary-foreground glow-red hover:bg-primary/90' :
            selected === 'driver' ? 'bg-green-600 text-white hover:bg-green-700' :
            'bg-yellow-600 text-background hover:bg-yellow-700'
          }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <>
              ENTER {selectedRole?.label}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Demo / Field Presentation Mode Bypass */}
        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              const res = login('DEMO@55');
              if (res.success) {
                navigate(res.route || '/pit');
              }
            }}
            className="text-[10px] font-mono tracking-widest text-muted-foreground/40 hover:text-primary transition-colors uppercase py-1.5 px-3.5 rounded border border-white/5 hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
          >
            ⚡ Launch Demo Mode (DEMO@55)
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-muted-foreground/20 tracking-widest mt-6">
          ELECTRATHON RACE INTELLIGENCE · SECURE CHANNEL
        </p>
      </motion.div>
    </div>
  );
}