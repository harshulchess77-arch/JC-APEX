import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ChevronDown, ChevronUp, Download } from 'lucide-react';

const SESSIONS = [
  { id: 1, event: 'Round 8 — Metro Circuit',   date: '2026-07-20', laps: 14, duration: '42:18', pos: 1, battery_used: 78, peak_speed: 38.2, avg_speed: 24.1, incidents: 0, oracle: 'Push window used on laps 6–9. Optimal battery management.', status: 'WIN' },
  { id: 2, event: 'Round 7 — Riverside Loop',  date: '2026-07-06', laps: 12, duration: '38:55', pos: 2, battery_used: 85, peak_speed: 36.8, avg_speed: 22.8, incidents: 1, oracle: 'Thermal sag lap 8. Strategy adjusted to conserve.', status: 'PODIUM' },
  { id: 3, event: 'Round 6 — Harbor Track',    date: '2026-06-22', laps: 15, duration: '46:30', pos: 1, battery_used: 72, peak_speed: 39.1, avg_speed: 25.4, incidents: 0, oracle: 'Perfect execution. Fastest lap overall.', status: 'WIN' },
  { id: 4, event: 'Round 5 — Hill Climb',      date: '2026-06-08', laps: 10, duration: '35:12', pos: 3, battery_used: 91, peak_speed: 33.4, avg_speed: 20.2, incidents: 0, oracle: 'Battery overuse early. Forced conserve mode.', status: 'PODIUM' },
  { id: 5, event: 'Round 4 — Tech Park',       date: '2026-05-25', laps: 13, duration: '40:44', pos: 2, battery_used: 80, peak_speed: 37.5, avg_speed: 23.5, incidents: 0, oracle: 'Strong pace. Lost 1 position on lap 11 yellow flag.', status: 'PODIUM' },
  { id: 6, event: 'Round 3 — Speedway Loop',   date: '2026-05-11', laps: 16, duration: '48:02', pos: 1, battery_used: 76, peak_speed: 40.1, avg_speed: 26.2, incidents: 0, oracle: 'Record lap. System nominal throughout.', status: 'WIN' },
  { id: 7, event: 'Round 2 — East Campus',     date: '2026-04-27', laps: 11, duration: '36:18', pos: 4, battery_used: 95, peak_speed: 31.2, avg_speed: 19.8, incidents: 2, oracle: 'Critical battery drain on lap 7. DNF narrowly avoided.', status: 'FINISH' },
  { id: 8, event: 'Round 1 — Opening Sprint',  date: '2026-04-13', laps: 12, duration: '39:50', pos: 2, battery_used: 83, peak_speed: 36.0, avg_speed: 22.0, incidents: 0, oracle: 'Season opener. Good pace, strong consistency.', status: 'PODIUM' },
];

const STATUS_STYLE = {
  WIN:    'bg-primary/20 text-primary border-primary/30',
  PODIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  FINISH: 'bg-white/5 text-white/40 border-white/10',
};

// Generate mock telemetry data for CSV export
function generateMockTelemetryData(session) {
  const data = [];
  const lapTime = (parseInt(session.duration.split(':')[0]) * 60 + parseInt(session.duration.split(':')[1])) / session.laps;
  for (let i = 0; i < session.laps; i++) {
    const lapSpeed = session.avg_speed + (Math.random() - 0.5) * 5;
    const voltage = 42 + (Math.random() - 0.5) * 4;
    const temp = 35 + (Math.random() - 0.5) * 15;
    const battery = 100 - (i / session.laps) * session.battery_used;
    data.push({
      timestamp: `${Math.floor(i * lapTime / 60).toString().padStart(2, '0')}:${Math.floor(i * lapTime % 60).toString().padStart(2, '0')}`,
      lap: i + 1,
      speed: lapSpeed.toFixed(1),
      voltage: voltage.toFixed(1),
      temp: temp.toFixed(1),
      battery: battery.toFixed(1),
      lap_time: lapTime.toFixed(1),
    });
  }
  return data;
}

function exportToCSV(session) {
  const data = generateMockTelemetryData(session);
  const headers = ['Timestamp', 'Lap', 'Speed (MPH)', 'Voltage (V)', 'Temp (°C)', 'Battery (%)', 'Lap Time (s)'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.timestamp,
      row.lap,
      row.speed,
      row.voltage,
      row.temp,
      row.battery,
      row.lap_time,
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${session.event.replace(/[^a-z0-9]/gi, '_')}_telemetry.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function RaceHistory() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-screen bg-[#08090C] flex flex-col">
      <header className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] bg-[#101217] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pit')} className="text-white/20 hover:text-white/60 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10" />
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-display font-black text-sm tracking-widest text-white">RACE HISTORY LOG</span>
        </div>
        <div className="flex items-center gap-4 text-[8px] font-mono text-white/25">
          <span>{SESSIONS.filter(s => s.status === 'WIN').length} WINS</span>
          <span>{SESSIONS.filter(s => s.status === 'PODIUM').length} PODIUMS</span>
          <span>{SESSIONS.length} TOTAL ROUNDS</span>
          <button
            onClick={() => exportToCSV(SESSIONS[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <Download className="w-3 h-3" />
            EXPORT ALL
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-2">
          {SESSIONS.map(s => (
            <div key={s.id} className="rounded border border-white/[0.06] bg-[#101217] overflow-hidden">
              {/* Row */}
              <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
                <span className={`text-[8px] font-display font-bold tracking-widest px-2 py-0.5 rounded border ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                <div className="flex-1">
                  <div className="text-sm font-display font-bold text-white/80">{s.event}</div>
                  <div className="text-[8px] font-mono text-white/25 mt-0.5">{s.date} · {s.laps} laps · {s.duration}</div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div className="text-center">
                    <div className="text-lg font-display font-black text-primary">P{s.pos}</div>
                    <div className="text-[7px] font-mono text-white/20">POSITION</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-display font-bold text-green-400">{s.avg_speed} mph</div>
                    <div className="text-[7px] font-mono text-white/20">AVG SPEED</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-display font-bold text-yellow-400">{s.battery_used}%</div>
                    <div className="text-[7px] font-mono text-white/20">BATT USED</div>
                  </div>
                  {expanded === s.id ? <ChevronUp className="w-3.5 h-3.5 text-white/20" /> : <ChevronDown className="w-3.5 h-3.5 text-white/20" />}
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === s.id && (
                <div className="border-t border-white/[0.04] px-4 py-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[8px] font-mono tracking-widest text-white/20 mb-2">SESSION SUMMARY</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Peak Speed', value: `${s.peak_speed} mph`, color: '#FF1E42' },
                        { label: 'Incidents',  value: s.incidents, color: s.incidents > 0 ? '#eab308' : '#22c55e' },
                      ].map(m => (
                        <div key={m.label} className="bg-[#08090C] rounded p-2.5">
                          <div className="text-[7px] font-mono text-white/20 mb-0.5">{m.label}</div>
                          <div className="text-base font-display font-black" style={{ color: m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono tracking-widest text-white/20 mb-2">ORACLE ASSESSMENT</div>
                    <div className="bg-[#08090C] rounded p-3 text-[9px] font-mono text-white/50 leading-relaxed border-l-2 border-primary/30">
                      {s.oracle}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => exportToCSV(s)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-primary/10 border border-primary/30 text-primary text-[9px] font-display font-bold tracking-wider hover:bg-primary/20 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      EXPORT TELEMETRY (CSV)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}