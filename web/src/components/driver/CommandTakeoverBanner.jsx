import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function CommandTakeoverBanner() {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const seenRef = useRef(new Set());
  const currentIdRef = useRef(null);
  const ackingRef = useRef(false);

  useEffect(() => { currentIdRef.current = current?.id || null; }, [current]);

  useEffect(() => {
    if (current && current.status === 'Acknowledged') setVisible(false);
  }, [current]);

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const list = await base44.entities.RaceMessage.list('-created_date', 20);
        const arr = (list || []).slice().sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')));
        arr.forEach(m => seenRef.current.add(m.id));
        const lastUnacked = [...arr].reverse().find(m => m.status !== 'Acknowledged');
        if (lastUnacked) {
          setCurrent(lastUnacked);
          setVisible(true);
          if (lastUnacked.status === 'Pending') {
            base44.entities.RaceMessage.update(lastUnacked.id, { status: 'Delivered' }).catch(() => {});
          }
        }
      } catch {}

      unsub = base44.entities.RaceMessage.subscribe((event) => {
        if (event.type === 'create') {
          if (!seenRef.current.has(event.data.id) && event.data.status === 'Pending') {
            seenRef.current.add(event.data.id);
            setCurrent(event.data);
            setVisible(true);
            base44.entities.RaceMessage.update(event.data.id, { status: 'Delivered' }).catch(() => {});
          } else {
            seenRef.current.add(event.data.id);
          }
        } else if (event.type === 'update') {
          seenRef.current.add(event.data.id);
          if (currentIdRef.current === event.data.id) setCurrent(event.data);
        }
      });
    })();
    return () => unsub?.();
  }, []);

  const ack = async () => {
    if (!current || ackingRef.current) return;
    ackingRef.current = true;
    try { await base44.entities.RaceMessage.update(current.id, { status: 'Acknowledged' }); } catch {}
    ackingRef.current = false;
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && current && current.status !== 'Acknowledged' && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center justify-center"
          style={{ height: '40%', background: '#facc15' }}>
          <div className="text-center px-4">
            <div className="text-[10px] font-mono tracking-[0.4em] text-black/50 mb-2">▼ PIT COMMAND</div>
            <div className="font-display font-black leading-none text-black tracking-tight" style={{ fontSize: 'clamp(44px, 7vw, 92px)' }}>
              {current.commandText}
            </div>
          </div>
          <button onClick={ack}
            className="mt-4 px-6 py-2 rounded bg-black text-yellow-400 font-display font-black tracking-widest text-sm hover:bg-zinc-800 transition-colors">
            ✓ ACKNOWLEDGE
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}