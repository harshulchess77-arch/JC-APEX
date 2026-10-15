export const TABS = [
  { id: 'overview',        label: 'OVERVIEW'         },
  { id: 'ai-oracle',       label: 'AI ORACLE'        },
  { id: 'strategy',        label: 'STRATEGY BOARD'   },
  { id: 'race-ops',        label: 'RACE OPS'         },
  { id: 'circuit-map',     label: 'CIRCUIT MAP'      },
  { id: 'driver-profiles', label: 'DRIVER PROFILES'  },
  { id: 'post-analysis',   label: 'POST-ANALYSIS'    },
];

export const STRATEGY_MODES = [
  { id: 'aggressive', label: 'AGGRESSIVE', sub: 'MAX POWER', clr: '#ef4444' },
  { id: 'balanced',   label: 'BALANCED',   sub: 'OPTIMAL',   clr: '#eab308' },
  { id: 'conserve',   label: 'CONSERVE',   sub: 'ECO MODE',  clr: '#22c55e' },
];

export const FLAGS = [
  { key: 'green',  label: 'GREEN',  cls: 'bg-green-700 hover:bg-green-600 text-white' },
  { key: 'yellow', label: 'YELLOW', cls: 'bg-yellow-600 hover:bg-yellow-500 text-black font-black' },
  { key: 'red',    label: 'RED',    cls: 'bg-red-700 hover:bg-red-600 text-white' },
  { key: 'black',  label: 'BLACK',  cls: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10' },
];
