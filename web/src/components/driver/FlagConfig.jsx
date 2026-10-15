/**
 * Flag configurations for the Driver HUD
 * Contains flag display styles and modal configurations
 */

export const FLAG_CFG = {
  green:  { border: 'border-[#10B981]/30',  bg: 'bg-[#10B981]/10',  text: 'text-[#10B981]',  label: '● GREEN'  },
  yellow: { border: 'border-[#FFB300]/30', bg: 'bg-[#FFB300]/10', text: 'text-[#FFB300]', label: '● YELLOW' },
  red:    { border: 'border-[#FF1E42]/30',    bg: 'bg-[#FF1E42]/10',    text: 'text-[#FF1E42]',    label: '● RED — STOP', pulse: true },
  black:  { border: 'border-white/10',      bg: 'bg-white/5',       text: 'text-white/40',   label: '● BLACK'  },
};

export const FLAG_MODAL_CFG = {
  yellow: {
    bg: 'bg-[#FFD600]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'YELLOW FLAG',
    description: 'CAUTION ON TRACK · MAINTAIN POSITION · SLOW DOWN',
    buttonClass: 'bg-black text-yellow-400 hover:bg-neutral-900 border-2 border-black',
  },
  red: {
    bg: 'bg-[#FF1E42]',
    text: 'text-white',
    subText: 'text-white/90',
    title: 'RED FLAG — STOP',
    description: 'SESSION SUSPENDED · BOX IMMEDIATELY',
    buttonClass: 'bg-white text-[#FF1E42] hover:bg-neutral-100 border-2 border-white',
    pulse: true,
  },
  black: {
    bg: 'bg-black border-4 border-white',
    text: 'text-white',
    subText: 'text-white/80',
    title: 'BLACK FLAG',
    description: 'PENALTY / DISQUALIFICATION · RETURN TO PIT LANE',
    buttonClass: 'bg-white text-black hover:bg-neutral-200 border-2 border-white',
  },
  green: {
    bg: 'bg-[#00E676]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'GREEN FLAG',
    description: 'TRACK CLEAR · RACE PACE ACTIVE',
    buttonClass: 'bg-black text-[#00E676] hover:bg-neutral-900 border-2 border-black',
  },
};

export const STRATEGY_MODAL_CFG = {
  AGGRESSIVE: {
    bg: 'bg-[#FF1E42]',
    text: 'text-white',
    subText: 'text-white/90',
    title: 'AGGRESSIVE',
    description: 'MAXIMUM POWER DEPLOYMENT · FULL ATTACK PACE',
    buttonClass: 'bg-white text-[#FF1E42] hover:bg-neutral-100 border-2 border-white',
  },
  BALANCED: {
    bg: 'bg-[#FFB300]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'BALANCED',
    description: 'OPTIMAL EFFICIENCY · MAINTAIN TARGET PACE',
    buttonClass: 'bg-black text-amber-400 hover:bg-neutral-900 border-2 border-black',
  },
  CONSERVE: {
    bg: 'bg-[#10B981]',
    text: 'text-black',
    subText: 'text-black/90',
    title: 'CONSERVE',
    description: 'ENERGY PRESERVATION MODE · LIFT AND COAST',
    buttonClass: 'bg-black text-emerald-400 hover:bg-neutral-900 border-2 border-black',
  },
};

export const COMMANDS = [
  { label: 'BOX THIS LAP', color: '#FF1E42', border: '#FF1E4230' },
  { label: 'SAVE ENERGY',  color: '#10B981', border: '#10B98130' },
  { label: 'HOLD PACE',    color: '#FFB300', border: '#FFB30030' },
  { label: 'PUSH HARD',    color: '#FF1E42', border: '#FF1E4230' },
  { label: 'COOL DOWN',    color: '#8A909D', border: '#8A909D30' },
];
