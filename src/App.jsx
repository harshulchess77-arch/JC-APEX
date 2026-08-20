import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import PasscodeProtectedRoute from '@/components/PasscodeProtectedRoute';
import { PasscodeAuthProvider } from '@/lib/PasscodeAuthContext';
import Landing from './pages/Landing';
import CommandCenter from './pages/CommandCenter';
import PasscodeLogin from './pages/PasscodeLogin';
import PitCenter from './pages/PitCenter';
import DriverHUD from './pages/DriverHUD';
import RaceDirector from './pages/RaceDirector';
import DriverProfile from './pages/DriverProfile';
import SeasonAnalytics from './pages/SeasonAnalytics';
import VehicleConfig from './pages/VehicleConfig';
import RaceHistory from './pages/RaceHistory';
import SystemLogs from './pages/SystemLogs';
import StrategyLibrary from './pages/StrategyLibrary';
import ChampionshipStandings from './pages/ChampionshipStandings';
import TelemetryDashboard from './pages/TelemetryDashboard';
import CircuitMap from './pages/CircuitMap';
import AppSettings from './pages/AppSettings';
import IncidentReports from './pages/IncidentReports';
import LiveComms from './pages/LiveComms';
import Benchmarks from './pages/Benchmarks';
import DataArchive from './pages/DataArchive';
import CircuitDatabase from './pages/CircuitDatabase';
import RaceSimulation from './pages/RaceSimulation';
import SafetyProtocols from './pages/SafetyProtocols';
import WeatherTracker from './pages/WeatherTracker';
import LapTiming from './pages/LapTiming';
import About from './pages/About';
import Contact from './pages/Contact';
import BenchmarkComparison from './pages/BenchmarkComparison';
import TelemetrySummary from './pages/TelemetrySummary';
import DriverFeedback from './pages/DriverFeedback';
import SystemDiagnostics from './pages/SystemDiagnostics';
import { RaceEngineProvider } from '@/lib/RaceEngineContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <RaceEngineProvider>
    <PasscodeAuthProvider>
    <Routes>
      {/* Custom passcode login (public) */}
      <Route path="/login" element={<PasscodeLogin />} />

      {/* All app routes require passcode auth */}
      <Route element={<PasscodeProtectedRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/pit" element={<PitCenter />} />
        <Route path="/driver" element={<DriverHUD />} />
        <Route path="/director" element={<RaceDirector />} />
        <Route path="/drivers" element={<DriverProfile />} />
        <Route path="/season-analytics" element={<SeasonAnalytics />} />
        <Route path="/vehicle-config" element={<VehicleConfig />} />
        <Route path="/race-history" element={<RaceHistory />} />
        <Route path="/system-logs" element={<SystemLogs />} />
        <Route path="/strategy-library" element={<StrategyLibrary />} />
        <Route path="/championship-standings" element={<ChampionshipStandings />} />
        <Route path="/telemetry-dashboard" element={<TelemetryDashboard />} />
        <Route path="/circuit-map" element={<CircuitMap />} />
        <Route path="/settings" element={<AppSettings />} />
        <Route path="/incident-reports" element={<IncidentReports />} />
        <Route path="/live-comms" element={<LiveComms />} />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route path="/data-archive" element={<DataArchive />} />
        <Route path="/circuit-database" element={<CircuitDatabase />} />
        <Route path="/race-simulation" element={<RaceSimulation />} />
        <Route path="/safety-protocols" element={<SafetyProtocols />} />
        <Route path="/weather-tracker" element={<WeatherTracker />} />
        <Route path="/lap-timing" element={<LapTiming />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/benchmark-comparison" element={<BenchmarkComparison />} />
        <Route path="/telemetry-summary" element={<TelemetrySummary />} />
        <Route path="/driver-feedback" element={<DriverFeedback />} />
        <Route path="/system-diagnostics" element={<SystemDiagnostics />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
    </PasscodeAuthProvider>
    </RaceEngineProvider>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App