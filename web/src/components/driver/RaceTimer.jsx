import React, { useState, useEffect } from 'react';

/**
 * RaceTimer - 62-minute countdown timer for Electrathon races
 * Descending timer: 62:00 -> 00:00
 */
export default function RaceTimer() {
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());
  const [sessionStartTime] = useState(() => Date.now());

  // Descending 62-minute countdown timer (Electrathon 62-Minute Rule: 62:00 -> 00:00)
  const SESSION_DURATION_MS = 62 * 60 * 1000; // 62 minutes in milliseconds
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = Math.max(0, currentTimestamp - sessionStartTime);
  const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);
  const remainingMinutes = Math.floor(remaining / 60000);
  const remainingSeconds = Math.floor((remaining % 60000) / 1000);
  const timeString = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase">Race Time</div>
      <div className="text-3xl font-display font-black text-white tabular-nums tracking-tight">
        {timeString}
      </div>
    </div>
  );
}
