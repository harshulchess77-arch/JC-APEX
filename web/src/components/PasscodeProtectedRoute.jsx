import { Outlet, Navigate } from 'react-router-dom';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

const Fallback = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#080808] text-white">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
    <div className="text-xs font-mono tracking-widest text-white/50 uppercase">AUTHENTICATING ACCESS...</div>
  </div>
);

export default function PasscodeProtectedRoute() {
  const { isAuthed, loading } = usePasscodeAuth();

  if (loading) return <Fallback />;

  // Allow access even without auth for demo mode
  // Remove this if you want strict authentication
  if (!isAuthed) {
    return <Outlet />;
  }

  return <Outlet />;
}