import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLAG_CFG, COMMANDS } from './FlagConfig';

/**
 * DriverTopBar - Top navigation bar for Driver HUD
 * @param {Object} props
 * @param {boolean} props.focusMode - Whether focus mode is active
 * @param {string} props.flag - Current flag (green/yellow/red/black)
 * @param {boolean} props.isDemoMode - Whether in demo mode
 * @param {boolean} props.isLive - Whether live mode is active
 * @param {number} props.safeLap - Current lap number
 * @param {string} props.timeString - Race time string
 * @param {number} props.safeBattery - Battery percentage
 * @param {string} props.signalStatus - Signal status text
 * @param {string} props.signalColor - Signal status color
 * @param {boolean} props.signalLost - Whether signal is lost
 * @param {Function} props.onLogout - Logout handler
 */
export default function DriverTopBar({
  focusMode,
  flag,
  isDemoMode,
  isLive,
  safeLap,
  timeString,
  safeBattery,
  signalStatus,
  signalColor,
  signalLost,
  onLogout,
}) {
  const navigate = useNavigate();
  const flagCfg = FLAG_CFG[flag] || FLAG_CFG.green;
  const battColor = safeBattery < 40 ? '#FF1E42' : safeBattery > 60 ? '#10B981' : '#FFB300';

  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 h-9 border-b border-white/[0.06] bg-[#08090C] glass">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-[7px] font-black text-white">JC</span>
          </div>
          <span className="font-display font-black text-sm tracking-widest text-white">APEX</span>
        </div>
        <button onClick={() => navigate('/pit')}
          className="flex items-center gap-1 text-[8px] font-mono tracking-widest text-white/40 hover:text-white transition-colors uppercase px-1.5 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
          <LayoutDashboard className="w-2.5 h-2.5" /> PIT
        </button>
        <button onClick={() => navigate('/director')}
          className="flex items-center gap-1 text-[8px] font-mono tracking-widest text-white/40 hover:text-white transition-colors uppercase px-1.5 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
          <Flag className="w-2.5 h-2.5" /> DIRECTOR
        </button>
        <AnimatePresence mode="wait">
          <motion.span key={flag} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`text-[8px] font-display font-bold tracking-widest px-2 py-0.5 rounded border ${flagCfg.border} ${flagCfg.bg} ${flagCfg.text} ${flagCfg.pulse ? 'animate-pulse' : ''}`}>
            {flagCfg.label}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-4 text-[8px] font-mono">
        {/* Mode Status Chip */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-mono font-bold tracking-widest ${
          isDemoMode
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : isLive
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {isDemoMode ? 'DEMO' : isLive ? 'LIVE' : 'NO SIGNAL'}
        </div>
        <span className="text-white/25">LAP <span className="text-white/60 font-bold">#{Math.floor(safeLap)}</span></span>
        <span className="text-[#FF1E42] font-bold tracking-widest">{timeString}</span>
        <span style={{ color: battColor }} className="font-bold">{safeBattery < 40 ? 'CONSERVE' : safeBattery > 60 ? 'BALANCED' : 'NOMINAL'}</span>
        <span className="text-white/15">GHOST-LINK™</span>
        {/* Signal Status */}
        <div className="flex items-center gap-1.5" style={{ color: signalColor }}>
          <div className={`w-1.5 h-1.5 rounded-full ${signalLost ? 'animate-pulse' : 'bg-current'}`} />
          <span className="font-bold">{signalStatus}</span>
        </div>
      </div>
      <button onClick={onLogout} className="text-white/15 hover:text-white/40 transition-colors">
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
