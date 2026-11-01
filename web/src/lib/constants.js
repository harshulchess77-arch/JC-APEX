/**
 * ============================================================================
 * JC-APEX UNIFIED CONSTANTS
 * ============================================================================
 * Centralized constants for telemetry, circuit, pit operations, and UI
 * Consolidated from scattered constants files across the codebase
 * ============================================================================
 */

// ============================================================================
// TELEMETRY CONSTANTS
// ============================================================================
export const ZERO_TELEMETRY = {
  speed: 0.00,
  speed_hall: 0.00,
  speed_gps: 0.00,
  battery: 0,
  temp: null,
  voltage: 0.00,
  current: 0.00,
  power: 0.00,
  latitude: 0.00,
  longitude: 0.00,
  efficiency: 0,
  lap: null,
  totalLaps: 30,
  raceTime: null,
  gpsFix: false,
  sats: 0,
};

// ============================================================================
// CIRCUIT MAP CONSTANTS
// ============================================================================
export const CIRCUIT_SECTORS = [
  { id: 1, name: 'Sector 1', time: '0:42.1', delta: '+0.3s', color: '#22c55e', type: 'STRAIGHT', drs: true },
  { id: 2, name: 'Sector 2', time: '1:05.8', delta: '-0.1s', color: '#eab308', type: 'TECHNICAL', drs: false },
  { id: 3, name: 'Sector 3', time: '0:58.4', delta: '+0.5s', color: '#ef4444', type: 'INFIELD', drs: false },
];

export const CIRCUIT_PIT_INFO = [
  { label: 'Pit Entry Speed Limit', value: '30 mph' },
  { label: 'Pit Lane Length', value: '180 m' },
  { label: 'Pit Stop Avg Time', value: '~28s' },
  { label: 'Pit Entry Marker', value: 'Turn 14 exit' },
];

export const CIRCUIT_SEGMENTS = [
  { name: 'Start / Finish', length: '320m', type: 'STRAIGHT', note: 'DRS zone active' },
  { name: 'Turn 1-2 Complex', length: '—', type: 'HAIRPIN', note: 'Tight entry, trail brake' },
  { name: 'Back Straight', length: '280m', type: 'STRAIGHT', note: 'Max speed zone' },
  { name: 'Chicane S3', length: '—', type: 'TECHNICAL', note: 'Energy recovery zone' },
  { name: 'Pit Entry', length: '—', type: 'PIT', note: '30 mph limit' },
  { name: 'Final Corner', length: '—', type: 'FAST BEND', note: 'Full throttle exit' },
];

// ============================================================================
// PIT CENTER CONSTANTS
// ============================================================================
export const PIT_TABS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'ai-oracle', label: 'AI ORACLE' },
  { id: 'strategy', label: 'STRATEGY BOARD' },
  { id: 'race-ops', label: 'RACE OPS' },
  { id: 'circuit-map', label: 'CIRCUIT MAP' },
  { id: 'driver-profiles', label: 'DRIVER PROFILES' },
  { id: 'post-analysis', label: 'POST-ANALYSIS' },
];

export const STRATEGY_MODES = [
  { id: 'aggressive', label: 'AGGRESSIVE', sub: 'MAX POWER', clr: '#ef4444' },
  { id: 'balanced', label: 'BALANCED', sub: 'OPTIMAL', clr: '#eab308' },
  { id: 'conserve', label: 'CONSERVE', sub: 'ECO MODE', clr: '#22c55e' },
];

export const RACE_FLAGS = [
  { key: 'green', label: 'GREEN', cls: 'bg-green-700 hover:bg-green-600 text-white' },
  { key: 'yellow', label: 'YELLOW', cls: 'bg-yellow-600 hover:bg-yellow-500 text-black font-black' },
  { key: 'red', label: 'RED', cls: 'bg-red-700 hover:bg-red-600 text-white' },
  { key: 'black', label: 'BLACK', cls: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' },
];

// ============================================================================
// UI SIDEBAR CONSTANTS
// ============================================================================
export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";

// ============================================================================
// COMMAND TYPES
// ============================================================================
export const COMMAND_TYPES = {
  BOX_THIS_LAP: 'BOX_THIS_LAP',
  PACE_UP: 'PACE_UP',
  PACE_DOWN: 'PACE_DOWN',
  TARGET_PACE: 'TARGET_PACE',
  PUSH_HARD: 'PUSH_HARD',
  SAVE_ENERGY: 'SAVE_ENERGY',
  FLAG: 'FLAG',
};

// ============================================================================
// COMMAND STATUS
// ============================================================================
export const COMMAND_STATUS = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  EXPIRED: 'EXPIRED',
};

// ============================================================================
// AI ORACLE CONSTANTS
// ============================================================================
export const AI_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const AI_CATEGORY = {
  ENERGY: 'ENERGY',
  STRATEGY: 'STRATEGY',
  SAFETY: 'SAFETY',
  WEATHER: 'WEATHER',
};

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================
export const SESSION_DURATION_MS = 62 * 60 * 1000; // 62 minutes
export const TELEMETRY_INTERVAL_MS = 200; // 5 Hz (200ms)
export const GPS_BAUD_RATE = 9600;
export const LORA_BAUD_RATE = 115200;

// ============================================================================
// F1 THEME COLORS
// ============================================================================
export const F1_COLORS = {
  carbon: '#08090C',
  crimson: '#FF1E42',
  surface: '#101217',
  slate: '#8A909D',
  nominal: '#10B981',
  cyan: '#00E5FF',
  gold: '#FFB300',
  border: '#1C1F28',
};
