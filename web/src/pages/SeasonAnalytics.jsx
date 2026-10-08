import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ArrowLeft, TrendingUp } from 'lucide-react';

const DRIVERS = ['JC', 'Driver 2', 'Driver 3', 'Driver 4'];
const RACES = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];

const performanceData = RACES.map((r, i) => ({
  race: r,
  JC: Math.round(55 + Math.random() * 40),
  'Driver 2': Math.round(40 + Math.random() * 45),
  'Driver 3': Math.round(30 + Math.random() * 50),
  'Driver 4': Math.round(20 + Math.random() * 55),
}));

const podiumData = [
  { driver: 'JC',       wins: 5, podiums: 7, dnfs: 1 },
  { driver: 'Driver 2', wins: 3, podiums: 5, dnfs: 2 },
  { driver: 'Driver 3', wins: 1, podiums: 4, dnfs: 0 },
  { driver: 'Driver 4', wins: 0, podiums: 2, dnfs: 3 },
];

const radarData = [
  { metric: 'Speed', JC: 90, 'Driver 2': 78, 'Driver 3': 65 },
  { metric: 'Efficiency', JC: 85, 'Driver 2': 80, 'Driver 3': 72 },
  { metric: 'Consistency', JC: 88, 'Driver 2': 70, 'Driver 3': 75 },
  { metric: 'Thermal Mgmt', JC: 92, 'Driver 2': 65, 'Driver 3': 80 },
  { metric: 'Battery Mgmt', JC: 87, 'Driver 2': 83, 'Driver 3': 68 },
  { metric: 'Pace', JC: 94, 'Driver 2': 75, 'Driver 3': 70 },
];

const COLORS = { JC: '#FF1E42', 'Driver 2': '#22c55e', 'Driver 3': '#FFB300', 'Driver 4': '#a78bfa' };

const tip = { contentStyle: { background: '#101217', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 10 }, labelStyle: { color: '#fff' } };

export default function SeasonAnalytics() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('JC');

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">SEASON ANALYTICS</span>
        </div>
        <span className="text-[8px] font-mono text-white/20 tracking-widest">2025–26 SEASON · 8 ROUNDS</span>
      </header>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'TOTAL RACES', value: 8, color: '#FF1E42' },
            { label: 'TOTAL WINS',  value: 9, color: '#22c55e' },
            { label: 'PODIUMS',     value: 18, color: '#eab308' },
            { label: 'DRIVERS',     value: 4, color: '#FFB300' },
          ].map(s => (
            <div key={s.label} className="rounded border border-white/[0.06] bg-[#101217] p-4 text-center">
              <div className="text-[8px] font-mono tracking-widest text-white/20 mb-1">{s.label}</div>
              <div className="text-3xl font-display font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Points over season */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Points Per Race</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={performanceData}>
                <XAxis dataKey="race" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
                <Tooltip {...tip} />
                {DRIVERS.slice(0, 3).map(d => (
                  <Line key={d} type="monotone" dataKey={d} stroke={COLORS[d]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Win / Podium bars */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Wins & Podiums</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={podiumData}>
                <XAxis dataKey="driver" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
                <Tooltip {...tip} />
                <Bar dataKey="wins" fill="#FF1E42" radius={2} />
                <Bar dataKey="podiums" fill="#eab308" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Driver Skill Radar</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: '#555' }} />
                <Radar name="JC" dataKey="JC" stroke="#FF1E42" fill="#FF1E42" fillOpacity={0.15} />
                <Radar name="Driver 2" dataKey="Driver 2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Driver table */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Driver Season Summary</div>
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-white/20 text-[8px] tracking-wider border-b border-white/[0.04]">
                  <th className="text-left pb-2">DRIVER</th>
                  <th className="text-center pb-2">WINS</th>
                  <th className="text-center pb-2">PODIUMS</th>
                  <th className="text-center pb-2">DNFs</th>
                  <th className="text-right pb-2">WIN%</th>
                </tr>
              </thead>
              <tbody>
                {podiumData.map((d, i) => (
                  <tr key={d.driver} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 flex items-center gap-2">
                      <span style={{ color: Object.values(COLORS)[i] }}>●</span> {d.driver}
                    </td>
                    <td className="text-center text-primary font-bold">{d.wins}</td>
                    <td className="text-center text-yellow-400">{d.podiums}</td>
                    <td className="text-center text-white/30">{d.dnfs}</td>
                    <td className="text-right text-green-400">{((d.wins / 8) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}