import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useTelemetry } from '../hooks/useTelemetry';

const LEAGUE_BENCHMARKS = [
  { metric: 'Speed',       current: null, league_avg: 26.4, top_10: 31.2, unit: 'mph' },
  { metric: 'Efficiency',  current: null, league_avg: 72.1, top_10: 88.4, unit: '%'   },
  { metric: 'Battery Mgmt',current: null, league_avg: 68.0, top_10: 85.0, unit: '%'   },
  { metric: 'Thermal Ctrl',current: null, league_avg: 70.0, top_10: 87.0, unit: 'score'},
  { metric: 'Consistency', current: null, league_avg: 74.0, top_10: 91.0, unit: 'score'},
  { metric: 'Lap Time',    current: null, league_avg: 4.20, top_10: 3.85, unit: 'min' },
];

const HISTORICAL = [
  { race: 'R1', jc: 76, league: 68, top10: 85 },
  { race: 'R2', jc: 71, league: 70, top10: 86 },
  { race: 'R3', jc: 83, league: 69, top10: 87 },
  { race: 'R4', jc: 78, league: 71, top10: 88 },
  { race: 'R5', jc: 85, league: 72, top10: 88 },
  { race: 'R6', jc: 91, league: 70, top10: 89 },
  { race: 'R7', jc: 80, league: 73, top10: 90 },
  { race: 'R8', jc: 88, league: 72, top10: 91 },
];

const radarData = [
  { metric: 'Speed',        JC: 90, League: 68, Top10: 82 },
  { metric: 'Efficiency',   JC: 85, League: 72, Top10: 88 },
  { metric: 'Consistency',  JC: 88, League: 74, Top10: 91 },
  { metric: 'Thermal',      JC: 84, League: 70, Top10: 87 },
  { metric: 'Batt Mgmt',    JC: 87, League: 68, Top10: 85 },
  { metric: 'Pace',         JC: 92, League: 75, Top10: 90 },
];

const tip = { contentStyle: { background: '#101217', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, borderRadius: 4 } };

export default function Benchmarks() {
  const navigate = useNavigate();
  const { telemetry } = useTelemetry();

  const benchmarks = LEAGUE_BENCHMARKS.map(b => ({
    ...b,
    current: b.metric === 'Speed' ? +telemetry.speed.toFixed(1) :
             b.metric === 'Efficiency' ? +telemetry.efficiency.toFixed(1) :
             b.metric === 'Battery Mgmt' ? +telemetry.battery.toFixed(1) :
             b.metric === 'Thermal Ctrl' ? Math.max(0, 100 - (telemetry.temp / 75) * 100).toFixed(1) :
             b.metric === 'Consistency' ? 88 : b.metric === 'Lap Time' ? 3.95 : 80,
  }));

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Target className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">PERFORMANCE BENCHMARKS</span>
        </div>
        <span className="text-[8px] font-mono text-white/20 tracking-widest">LEAGUE AVG · TOP 10% · JC CURRENT</span>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Benchmark comparison table */}
        <div className="rounded border border-white/[0.06] bg-[#101217] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Live vs League Benchmarks</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {benchmarks.map(b => {
              const pctOfTop = Math.min((b.current / b.top_10) * 100, 100);
              const aboveLeague = b.current >= b.league_avg;
              return (
                <div key={b.metric} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-32 text-[9px] font-display font-bold text-white/50">{b.metric}</div>
                  <div className="flex-1">
                    <div className="relative h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      {/* League avg marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/40 z-10"
                        style={{ left: `${(b.league_avg / b.top_10) * 100}%` }} />
                      {/* Current bar */}
                      <div className="absolute top-0 bottom-0 left-0 rounded-full transition-all"
                        style={{ width: `${pctOfTop}%`, backgroundColor: aboveLeague ? '#22c55e' : '#eab308' }} />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[7px] font-mono text-white/20">
                      <span>League avg: <span className="text-yellow-400">{b.league_avg} {b.unit}</span></span>
                      <span>Top 10%: <span className="text-green-400">{b.top_10} {b.unit}</span></span>
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-lg font-display font-black" style={{ color: aboveLeague ? '#22c55e' : '#eab308' }}>
                      {b.current} <span className="text-[9px] font-mono text-white/20">{b.unit}</span>
                    </div>
                    <div className={`text-[8px] font-mono ${aboveLeague ? 'text-green-400' : 'text-yellow-400'}`}>
                      {aboveLeague ? '▲ ABOVE AVG' : '▼ BELOW AVG'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Historical performance score */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Performance Score History</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={HISTORICAL} barGap={2}>
                <XAxis dataKey="race" tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#555' }} axisLine={false} tickLine={false} domain={[60, 100]} />
                <Tooltip {...tip} />
                <ReferenceLine y={72} stroke="#eab30830" strokeDasharray="3 3" label={{ value: 'Avg', fontSize: 8, fill: '#eab308' }} />
                <Bar dataKey="top10" fill="#22c55e20" radius={2} />
                <Bar dataKey="jc" fill="#FF1E42" radius={2} />
                <Bar dataKey="league" fill="#FFB30040" radius={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="rounded border border-white/[0.06] bg-[#101217] p-4">
            <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-4">Multi-Metric Radar</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: '#555' }} />
                <Radar name="JC"     dataKey="JC"     stroke="#FF1E42" fill="#FF1E42" fillOpacity={0.15} />
                <Radar name="League" dataKey="League" stroke="#FFB300" fill="#FFB300" fillOpacity={0.08} />
                <Radar name="Top 10" dataKey="Top10"  stroke="#22c55e" fill="#22c55e" fillOpacity={0.06} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}