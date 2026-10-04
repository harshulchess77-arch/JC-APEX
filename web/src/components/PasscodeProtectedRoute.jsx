import { Outlet, Navigate } from 'react-router-dom';
import { usePasscodeAuth } from '@/lib/PasscodeAuthContext';

const Fallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function PasscodeProtectedRoute() {
  const { isAuthed, loading } = usePasscodeAuth();

  if (loading) return <Fallback />;
  if (!isAuthed) return <Navigate to="/" replace />;

  return <Outlet />;
}