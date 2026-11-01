import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import Forbidden from './pages/Forbidden';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import PasscodeProtectedRoute from '@/components/PasscodeProtectedRoute';
import { PasscodeAuthProvider } from '@/lib/PasscodeAuthContext';
import Landing from './pages/landings';
import RoleSelect from './pages/RoleSelect';
import PitCenter from './pages/PitCenter';
import DriverHUD from './pages/DriverHUD';
import { RaceEngineProvider } from '@/lib/RaceEngineContext';
import { WeatherProvider } from '@/lib/WeatherContext';
import GlobalCommandOverlay from './components/driver/GlobalCommandOverlay';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#08090C] text-white">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <div className="text-xs font-mono tracking-widest text-white/50 uppercase">INITIALIZING SYSTEM...</div>
      </div>
    );
  }

  return (
    <RaceEngineProvider>
      <Routes>
        {/* ── PUBLIC ROUTES (no auth required) ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<RoleSelect />} />

        {/* ── ERROR PAGES ── */}
        <Route path="/404" element={<NotFound />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/403" element={<Forbidden />} />

        {/* ── PROTECTED ROUTES (require passcode auth) ── */}
        <Route element={<PasscodeProtectedRoute />}>
          <Route path="/pit"                    element={<PitCenter />} />
          <Route path="/driver"                 element={<DriverHUD />} />
          <Route path="*"                       element={<Navigate to="/pit" replace />} />
        </Route>
      </Routes>
    </RaceEngineProvider>
  );
};


function App() {
  return (
    <AuthProvider>
      <PasscodeAuthProvider>
        <WeatherProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
              {/* DriverCommandListener at absolute root level - never unmounts */}
              <GlobalCommandOverlay />
              <Toaster />
            </Router>
          </QueryClientProvider>
        </WeatherProvider>
      </PasscodeAuthProvider>
    </AuthProvider>
  );
}

export default App