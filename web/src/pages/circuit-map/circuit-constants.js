export const SECTORS = [
  { id: 1, name: 'Sector 1', time: '0:42.1', delta: '+0.3s', color: '#22c55e', type: 'STRAIGHT',   drs: true  },
  { id: 2, name: 'Sector 2', time: '1:05.8', delta: '-0.1s', color: '#eab308', type: 'TECHNICAL',  drs: false },
  { id: 3, name: 'Sector 3', time: '0:58.4', delta: '+0.5s', color: '#ef4444', type: 'INFIELD',    drs: false },
];

export const PIT_INFO = [
  { label: 'Pit Entry Speed Limit', value: '30 mph' },
  { label: 'Pit Lane Length',       value: '180 m' },
  { label: 'Pit Stop Avg Time',     value: '~28s' },
  { label: 'Pit Entry Marker',      value: 'Turn 14 exit' },
];

export const SEGMENTS = [
  { name: 'Start / Finish',   length: '320m', type: 'STRAIGHT',   note: 'DRS zone active' },
  { name: 'Turn 1-2 Complex', length: '—',    type: 'HAIRPIN',    note: 'Tight entry, trail brake' },
  { name: 'Back Straight',    length: '280m', type: 'STRAIGHT',   note: 'Max speed zone' },
  { name: 'Chicane S3',       length: '—',    type: 'TECHNICAL',  note: 'Energy recovery zone' },
  { name: 'Pit Entry',        length: '—',    type: 'PIT',        note: '30 mph limit' },
  { name: 'Final Corner',     length: '—',    type: 'FAST BEND',  note: 'Full throttle exit' },
];
