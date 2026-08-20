import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useRaceEngine } from '@/lib/RaceEngineContext';

const tip = { contentStyle: { background: '#111', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, borderRadius: 4 }, labelStyle: { color: '#fff' } };

export default function LapGapChart() {
  const { laps, session } = useRaceEngine();

  const data = useMemo(() => {
    const byLap = {};
    (laps || []).forEach(l => {
      (byLap[l.lap_number] = byLap[l.lap_number] || {})[l.car] = l.lap_time;
    });
    const totals = { our: 0, comp1: 0, comp2: 0 };
    return Object.keys(byLap).map(Number).sort((a, b) => a - b).map(n => {
      ['our', 'comp1', 'comp2'].forEach(k => { if (byLap[n][k] != null) totals[k] += byLap[n][k]; });
      return {
        lap: `L${n}`,
        vsComp1: +(totals.our - totals.comp1).toFixed(2),
        vsComp2: +(totals.our - totals.comp2).toFixed(2),
      };
    });
  }, [laps]);

  const hasData = data.length > 0;

  return (
    <div className="rounded border border-white/[0.06] bg-[#0e0e0e] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">Lap-by-Lap Gap vs Competitors</span>
        <div className="flex items-center gap-4 text-[8px] font-mono text-white/30">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-blue-400" />vs COMP1</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block bg-purple-400" />vs COMP2</span>
        </div>
      </div>
      <div className="h-56">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="lap" tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} unit="s" />
              <Tooltip {...tip} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="vsComp1" stroke="#60a5fa" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} name="vs COMP1" />
              <Line type="monotone" dataKey="vsComp2" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} name="vs COMP2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[9px] font-mono text-white/25">
            {session ? 'Waiting for lap data…' : 'No active race session — start a race to see live gaps'}
          </div>
        )}
      </div>
      <p className="text-[8px] font-mono text-white/20 mt-2">Positive = behind competitor · Negative = ahead · Updates live each lap</p>
    </div>
  );
}