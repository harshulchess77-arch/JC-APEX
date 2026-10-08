import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import PasscodeProtectedRoute from '@/components/PasscodeProtectedRoute';
import { PasscodeAuthProvider } from '@/lib/PasscodeAuthContext';
import Landing from './pages/landings';
import RoleSelect from './pages/RoleSelect';
import CommandCenter from './pages/CommandCenter';
import PitCenter from './pages/PitCenter';
import DriverHUD from './pages/DriverHUD';
import RaceDirector from './pages/RaceDirector';
import DriverProfile from './pages/DriverProfile';
import StrategyLibrary from './pages/StrategyLibrary';
import ChampionshipStandings from './pages/ChampionshipStandings';
import TelemetryDashboard from './pages/TelemetryDashbaord';
import CircuitMap from './pages/CircuitMap';
import AppSettings from './pages/AppSettings';
import LiveComms from './pages/LiveComms';
import Benchmarks from './pages/Benchmarks';
import { RaceEngineProvider } from '@/lib/RaceEngineContext';

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
        {/* Root renders the high-level public Landing / Home page */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<RoleSelect />} />
        <Route path="/command-center" element={<Navigate to="/pit" replace />} />

        {/* ── PROTECTED ROUTES (require passcode auth) ── */}
        <Route element={<PasscodeProtectedRoute />}>
          <Route path="/pit"                    element={<PitCenter />} />
          <Route path="/driver"                 element={<DriverHUD />} />
          <Route path="/director"               element={<RaceDirector />} />
          <Route path="/drivers"                element={<DriverProfile />} />
          <Route path="/strategy-library"       element={<StrategyLibrary />} />
          <Route path="/championship-standings" element={<ChampionshipStandings />} />
          <Route path="/telemetry-dashboard"    element={<TelemetryDashboard />} />
          <Route path="/circuit-map"            element={<CircuitMap />} />
          <Route path="/settings"               element={<AppSettings />} />
          <Route path="/live-comms"             element={<LiveComms />} />
          <Route path="/benchmarks"             element={<Benchmarks />} />
          <Route path="*"                       element={<PageNotFound />} />
        </Route>
      </Routes>
    </RaceEngineProvider>
  );
};


function App() {
  return (
    <AuthProvider>
      <PasscodeAuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </PasscodeAuthProvider>
    </AuthProvider>
  );
}

export default App