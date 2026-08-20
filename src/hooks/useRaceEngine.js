import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Demo cadence: one lap every 4 seconds. Adjust for faster/slower playback.
const LAP_INTERVAL = 4000;

export function useRaceEngineLogic({ control = false } = {}) {
  const [session, setSession] = useState(null);
  const [laps, setLaps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const lapTimerRef = useRef(null);
  const lapCountRef = useRef(0);
  const sessionRef = useRef(null);

  // Load active session + realtime subscriptions
  useEffect(() => {
    let unsubLaps, unsubMsgs;
    let cancelled = false;

    (async () => {
      try {
        const sessions = await base44.entities.RaceSession.list('-created_date', 10);
        const active = (sessions || []).find(s => s.status === 'running' || s.status === 'setup') || null;
        if (cancelled) return;
        sessionRef.current = active;
        setSession(active);
        if (active) {
          const lapRecs = await base44.entities.LapLog.filter({ session_id: active.id }, 'lap_number', 500);
          if (cancelled) return;
          setLaps(lapRecs || []);
          lapCountRef.current = (lapRecs || []).reduce((m, r) => Math.max(m, r.lap_number || 0), 0);
          const msgs = await base44.entities.CommsMessage.filter({ session_id: active.id }, 'created_date', 200);
          if (cancelled) return;
          setMessages(msgs || []);
        }
      } catch (e) {
        // entities may not be provisioned yet — fail silently
      }
      if (!cancelled) setLoading(false);

      unsubLaps = base44.entities.LapLog.subscribe((event) => {
        const sid = sessionRef.current?.id;
        if (!sid || event.data?.session_id !== sid) return;
        setLaps(prev => {
          if (event.type === 'create') return [...prev, event.data];
          if (event.type === 'delete') return prev.filter(l => l.id !== event.data.id);
          return prev.map(l => (l.id === event.data.id ? event.data : l));
        });
      });
      unsubMsgs = base44.entities.CommsMessage.subscribe((event) => {
        const sid = sessionRef.current?.id;
        if (!sid || event.data?.session_id !== sid) return;
        setMessages(prev => {
          if (event.type === 'create') {
            const next = [...prev, event.data];
            next.sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')));
            return next;
          }
          if (event.type === 'delete') return prev.filter(m => m.id !== event.data.id);
          return prev.map(m => (m.id === event.data.id ? event.data : m));
        });
      });
    })();

    return () => { cancelled = true; unsubLaps?.(); unsubMsgs?.(); };
  }, []);

  // Lap generation loop — only the control instance drives it
  useEffect(() => {
    if (!control || !session || session.status !== 'running') return;
    const cars = [
      { key: 'our',   name: session.our_name,         number: session.our_number,         base: 62 },
      { key: 'comp1', name: session.competitor1_name, number: session.competitor1_number, base: 64 },
      { key: 'comp2', name: session.competitor2_name, number: session.competitor2_number, base: 61 },
    ];

    lapTimerRef.current = setInterval(async () => {
      const sid = session.id;
      const total = session.total_laps;
      const nextLap = lapCountRef.current + 1;
      if (nextLap > total) {
        clearInterval(lapTimerRef.current);
        try { await base44.entities.RaceSession.update(sid, { status: 'finished' }); } catch {}
        setSession(s => (s && s.id === sid ? { ...s, status: 'finished' } : s));
        return;
      }
      lapCountRef.current = nextLap;
      const timed = cars.map(c => ({ ...c, time: +(c.base + (Math.random() - 0.5) * 4).toFixed(2) }));
      const leader = Math.min(...timed.map(c => c.time));
      try {
        await base44.entities.LapLog.bulkCreate(timed.map(c => ({
          session_id: sid,
          lap_number: nextLap,
          car: c.key,
          car_name: c.name,
          car_number: c.number,
          lap_time: c.time,
          gap: +(c.time - leader).toFixed(2),
        })));
      } catch {}
    }, LAP_INTERVAL);

    return () => clearInterval(lapTimerRef.current);
  }, [control, session]);

  const startRace = useCallback(async (config) => {
    const rec = await base44.entities.RaceSession.create({
      status: 'running',
      total_laps: config.total_laps,
      our_name: config.our_name,
      our_number: config.our_number,
      competitor1_name: config.comp1_name,
      competitor1_number: config.comp1_number,
      competitor2_name: config.comp2_name,
      competitor2_number: config.comp2_number,
      start_time: new Date().toISOString(),
    });
    lapCountRef.current = 0;
    sessionRef.current = rec;
    setLaps([]);
    setMessages([]);
    setSession(rec);
    return rec;
  }, []);

  const stopRace = useCallback(async () => {
    if (lapTimerRef.current) clearInterval(lapTimerRef.current);
    if (!session) return;
    try { await base44.entities.RaceSession.update(session.id, { status: 'finished' }); } catch {}
    setSession(s => (s ? { ...s, status: 'finished' } : s));
  }, [session]);

  const sendComms = useCallback(async ({ sender, text, audio_url, type }) => {
    if (!session) return null;
    try {
      return await base44.entities.CommsMessage.create({
        session_id: session.id,
        sender,
        text: text || '',
        audio_url: audio_url || null,
        type: type || 'text',
      });
    } catch { return null; }
  }, [session]);

  return {
    session, laps, messages, loading,
    startRace, stopRace, sendComms,
    isRunning: session?.status === 'running',
    isFinished: session?.status === 'finished',
  };
}