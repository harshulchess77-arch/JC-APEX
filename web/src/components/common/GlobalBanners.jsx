import { useEffect, useState } from 'react';
import { WifiOff, Signal, Activity } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[var(--z-toast)] bg-[var(--color-critical)] text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono">
      <WifiOff className="w-4 h-4" />
      <span>OFFLINE - CHECK CONNECTION</span>
    </div>
  );
}

export function SignalLostBanner({ signalLost, lastPacketTime }) {
  if (!signalLost) return null;

  const secondsSinceLastPacket = Math.floor((Date.now() - lastPacketTime) / 1000);

  return (
    <div className="fixed top-0 left-0 right-0 z-[var(--z-toast)] bg-[var(--color-warning)] text-black px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono">
      <Signal className="w-4 h-4" />
      <span>SIGNAL LOST - LAST PACKET {secondsSinceLastPacket}s AGO</span>
    </div>
  );
}

export function DemoModeBanner({ isDemoMode }) {
  if (!isDemoMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[var(--z-toast)] bg-[var(--color-data)] text-black px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono">
      <Activity className="w-4 h-4" />
      <span>DEMO MODE - SIMULATED TELEMETRY</span>
    </div>
  );
}
