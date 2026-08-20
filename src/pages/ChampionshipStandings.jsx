import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const STANDINGS = [
  { pos: 1, driver: 'JC',        team: 'JC APEX',     pts: 187, wins: 5, podiums: 7, dnfs: 1, best: 'P1', gap: '—',   color: '#ef4444' },
  { pos: 2, driver: 'M. Santos', team: 'Velocity RT', pts: 152, wins: 3, podiums: 5, dnfs: 2, best: 'P1', gap: '-35', color: '#22c55e' },
  { pos: 3, driver: 'A. Park',   team: 'EV Racers',   pts: 118, wins: 1, podiums: 4, dnfs: 0, best: 'P2', gap: '-69', color: '#60a5fa' },
  { pos: 4, driver: 'T. Obi',    team: 'Surge SC',    pts:  91, wins: 0, podiums: 2, dnfs: 3, best: 'P3', gap: '-96', color: '#a78bfa' },
  { pos: 5, driver: 'P. Reyes',  team: 'Kinetic R',   pts:  74, wins: 0, podiums: 1, dnfs: 1, best: 'P3', gap: '-113', color: '#eab308' },
  { pos: 6, driver: 'L. Kovak',  team: 'Zero G',      pts:  55, wins: 0, podiums: 0, dnfs: 2, best: 'P4', gap: '-132', color: '#22d3ee' },
];

const PTS_SCALE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const RACE_RESULTS = [
  { race: 'R1', JC: 'P2', 'M. Santos': 'P1', 'A. Park': 'P3', 'T. Obi': 'P5', 'P. Reyes': 'P4', 'L. Kovak': 'P6' },
  { race: 'R2', JC: 'P4', 'M. Santos': 'P2', 'A. Park': 'P1', 'T. Obi': 'P3', 'P. Reyes': 'P6', 'L. Kovak': 'P5' },
  { race: 'R3', JC: 'P1', 'M. Santos': 'P3', 'A. Park': 'P2', 'T. Obi': 'P4', 'P. Reyes': 'P5', 'L. Kovak': 'P6' },
  { race: 'R4', JC: 'P3', 'M. Santos': 'P1', 'A. Park': 'P4', 'T. Obi': 'DNF','P. Reyes': 'P2', 'L. Kovak': 'P5' },
  { race: 'R5', JC: 'P2', 'M. Santos': 'P3', 'A. Park': 'P1', 'T. Obi': 'P5', 'P. Reyes': 'P4', 'L. Kovak': 'P6' },
  { race: 'R6', JC: 'P1', 'M. Santos': 'P2', 'A. Park': 'P4', 'T. Obi': 'P3', 'P. Reyes': 'P6', 'L. Kovak': 'DNF'},
  { race: 'R7', JC: 'P2', 'M. Santos': 'P1', 'A. Park': 'P3', 'T. Obi': 'P6', 'P. Reyes': 'P4', 'L. Kovak': 'P5' },
  { race: 'R8', JC: 'P1', 'M. Santos': 'P3', 'A. Park': 'P2', 'T. Obi': 'P4', 'P. Reyes': 'P5', 'L. Kovak': 'P6' },
];

const POS_STYLE = (p) => p === 'P1' ? 'text-yellow-400 font-bold' : p === 'P2' ? 'text-white/60' : p === 'P3' ? 'text-yellow-700' : p === 'DNF' ? 'text-primary' : 'text-white/25';

const tip = { contentStyle: { background: '#111', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, borderRadius: 4 } };

export default function ChampionshipStandings() {
  const navigate = useNavigate();
  const chartData = STANDINGS.map(s => ({ driver: s.driver, points: s.pts, color: s.color }));

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-display font-black text-sm tracking-widest text-white">CHAMPIONSHIP STANDINGS</span>
        </div>
        <span className="text-[8px] font-mono text-white/20 tracking-widest">2025–26 · 8/12 ROUNDS COMPLETE</span>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Points bar chart */}
        <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
          <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Championship Points</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="driver" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
              <Tooltip {...tip} />
              <Bar dataKey="points" radius={[3, 3, 0, 0]}
                fill="#ef4444"
                label={{ position: 'top', fontSize: 9, fill: '#888' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Main standings table */}
          <div className="col-span-3 rounded border border-white/[0.06] bg-[#0e0e0e] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.04] bg-[#0b0b0b]">
              <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Driver Standings</span>
            </div>
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['POS', 'DRIVER', 'TEAM', 'PTS', 'WINS', 'PODS', 'GAP'].map(h => (
                    <th key={h} className="px-3 py-2 text-[8px] font-mono tracking-wider text-white/20 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STANDINGS.map(s => (
                  <tr key={s.pos} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${s.pos === 1 ? 'bg-yellow-500/3' : ''}`}>
                    <td className="px-3 py-2.5">
                      <span className={`text-base font-display font-black ${s.pos === 1 ? 'text-yellow-400' : 'text-white/30'}`}>{s.pos}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="font-display font-bold text-white/70">{s.driver}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-white/30">{s.team}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-base font-display font-black" style={{ color: s.color }}>{s.pts}</span>
                    </td>
                    <td className="px-3 py-2.5 text-primary font-bold">{s.wins}</td>
                    <td className="px-3 py-2.5 text-yellow-400">{s.podiums}</td>
                    <td className="px-3 py-2.5 text-white/25">{s.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Race-by-race results */}
          <div className="col-span-2 rounded border border-white/[0.06] bg-[#0e0e0e] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.04] bg-[#0b0b0b]">
              <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Round-by-Round Results</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-2 py-2 text-[8px] text-white/20 text-left">DRIVER</th>
                    {RACE_RESULTS.map(r => <th key={r.race} className="px-2 py-2 text-[8px] text-white/20 text-center">{r.race}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {STANDINGS.map(s => (
                    <tr key={s.driver} className="border-b border-white/[0.03]">
                      <td className="px-2 py-1.5 font-bold text-white/50">{s.driver.split(' ')[0]}</td>
                      {RACE_RESULTS.map(r => (
                        <td key={r.race} className={`px-2 py-1.5 text-center ${POS_STYLE(r[s.driver])}`}>
                          {r[s.driver] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}