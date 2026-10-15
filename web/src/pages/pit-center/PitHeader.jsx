import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Car, Flag, Download } from 'lucide-react';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';
import { exportTelemetryPDF } from '@/utils/pdfExport';
import { logger } from '@/utils/logger';

export function MetricChip({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 border-r border-white/5 last:border-r-0">
      <span className="text-xs font-display font-bold" style={{ color, textShadow: `0 0 10px ${color}60` }}>{value}</span>
      <span className="text-[8px] font-mono text-white/20 tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

export default function PitHeader({
  telemetry,
  isDemoMode,
  isLive,
  signalLost,
  lastPacketTime,
  sessionActive,
  setSessionActive,
  sessionId,
  telemetryHistory,
  activeTab,
  setActiveTab,
  flag,
}) {
  const navigate = useNavigate();
  const { logout } = usePasscodeAuth();
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const battColor = telemetry.battery < 20 ? '#FF1E42' : telemetry.battery < 40 ? '#FFB300' : '#10B981';
  const tempColor = telemetry.temp > 58 ? '#FF1E42' : telemetry.temp > 46 ? '#FFB300' : '#10B981';

  const handleQuickExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      await exportTelemetryPDF({
        sessionId: sessionId || 'JC-APEX-LIVE',
        telemetry,
        telemetryHistory: telemetryHistory || []
      });
    } catch (err) {
      logger.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
      {/* ─── HEADER ─── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-10 border-b border-white/[0.06] bg-[#101217] glass">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <span className="text-[8px] font-black text-white">JC</span>
            </div>
            <span className="font-display font-black text-sm tracking-widest text-white">APEX</span>
            <span className="text-white/15 text-xs font-mono ml-1">RACE INTELLIGENCE</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[9px] font-mono tracking-widest text-primary font-bold uppercase px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            PIT CENTER
          </span>
          <button onClick={() => navigate('/driver')}
            className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-white/40 hover:text-white transition-colors uppercase px-2 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
            <Car className="w-3 h-3" /> DRIVER HUD
          </button>
          <button onClick={() => navigate('/director')}
            className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-white/40 hover:text-white transition-colors uppercase px-2 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
            <Flag className="w-3 h-3" /> DIRECTOR
          </button>
          <button onClick={() => setActiveTab('driver-profiles')}
            className={`flex items-center gap-1 text-[9px] font-mono tracking-widest transition-colors uppercase px-2 py-0.5 rounded ${
              activeTab === 'driver-profiles'
                ? 'bg-primary/10 text-primary border border-primary/25'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}>
            <Users className="w-3 h-3" /> DRIVERS
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Mode Status Chip */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-mono font-bold tracking-widest ${
            isDemoMode
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : isLive
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {isDemoMode ? 'DEMO' : isLive ? 'LIVE' : 'NO SIGNAL'}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-green-400 tracking-widest">GHOST-LINK™ ACTIVE</span>
          </div>
          {/* Signal Status */}
          <div className="flex items-center gap-1.5 text-[8px] font-mono">
            <span className="text-white/20">SIGNAL:</span>
            <span className={signalLost ? 'text-red-400 animate-pulse' : 'text-green-400'}>
              {signalLost ? 'LOST' : `${Math.floor((Date.now() - lastPacketTime) / 1000)}s ago`}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/20">
            {sessionActive ? '● SESSION LIVE' : '○ STANDBY'}
          </span>
          <button
            onClick={handleQuickExportPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-display font-bold tracking-wider uppercase transition-all border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            {isExportingPdf ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
          <button onClick={() => setSessionActive(v => !v)}
            className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-display font-bold tracking-widest uppercase transition-all ${
              sessionActive
                ? 'bg-[#1a0000] border border-primary/50 text-primary'
                : 'bg-green-600 border border-green-400/50 text-white hover:bg-green-500'
            }`}>
              {sessionActive ? '■ TERMINATE' : '▶ INITIATE SESSION'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-white/15 hover:text-white/40 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── METRICS STRIP ─── */}
      <div className="flex-shrink-0 flex items-center border-b border-white/[0.06] bg-[#101217] overflow-x-auto">
        <MetricChip label="BATTERY" value={`${(telemetry.battery ?? 0).toFixed(1)}%`} color={battColor} />
        <MetricChip label="TEMP" value={`${(telemetry.temp ?? 0).toFixed(1)}°C`} color={tempColor} />
        <MetricChip label="EFFICIENCY" value={`${(telemetry.efficiency ?? 0).toFixed(0)}%`} color="#10B981" />
        <MetricChip label="POWER (WATTS)" value={`${((telemetry.power != null ? telemetry.power : (telemetry.current ?? 0) * (telemetry.voltage ?? 0)).toFixed(0))}W`} color="#FF1E42" />
        <MetricChip label="48V VOLTAGE" value={`${(telemetry.voltage ?? 0).toFixed(1)}V`} color="#FF1E42" />
        <MetricChip label="CURRENT" value={`${(telemetry.current ?? 0).toFixed(1)}A`} color="#FFB300" />
        <MetricChip label="HALL SPEED" value={`${((telemetry.speed_hall != null ? telemetry.speed_hall : telemetry.speed) ?? 0).toFixed(1)}`} color="#FF1E42" />
        <MetricChip label="GPS SPEED" value={`${((telemetry.speed_gps != null ? telemetry.speed_gps : telemetry.speed) ?? 0).toFixed(1)}`} color="#FFB300" />
        <MetricChip label="COMPLETED LAPS" value={`#${Math.floor(telemetry.lap ?? 0)}`} color="#10B981" />
        <MetricChip label="DISTANCE" value={`${(Math.floor(telemetry.lap ?? 0) * 0.25).toFixed(2)}mi`} color="#FF1E42" />
        <div className="ml-auto flex-shrink-0 px-3">
          <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded border tracking-widest ${
            flag === 'green'  ? 'border-green-500/40 text-green-400 bg-green-500/10' :
            flag === 'yellow' ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' :
            flag === 'red'    ? 'border-primary/40 text-primary bg-primary/10 animate-pulse' :
            flag === 'black'  ? 'border-white/20 text-white bg-black' :
                                'border-white/10 text-white/30 bg-white/5'
          }`}>● {flag.toUpperCase()}</span>
        </div>
      </div>
    </>
  );
}

export { MetricChip };
