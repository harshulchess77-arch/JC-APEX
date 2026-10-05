import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

const Fallback = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#080808] text-white">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
    <div className="text-xs font-mono tracking-widest text-white/50 uppercase">AUTHENTICATING ACCESS...</div>
  </div>
);

export default function PasscodeProtectedRoute() {
  const { isAuthed, role, userRole, loading } = usePasscodeAuth();
  const location = useLocation();

  if (loading) return <Fallback />;

  // 1. Not authenticated — redirect to login, preserving intended destination
  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Strict Role Access Control for Driver HUD (/driver):
  // If a user tries to access /driver without the DGATSA@55 or RDGATSA@55 session, redirect them to /login
  const effectiveRole = userRole || role;
  if (location.pathname === '/driver') {
    const isDriverAuthorized = effectiveRole === 'driver' || effectiveRole === 'director';
    if (!isDriverAuthorized) {
      console.warn(`[AUTH] Access to /driver denied for role: "${effectiveRole}". Requires DGATSA@55 or RDGATSA@55.`);
      return <Navigate to="/login" state={{ from: location, unauthorized: true, requiredRole: 'driver' }} replace />;
    }
  }

  return <Outlet />;
}