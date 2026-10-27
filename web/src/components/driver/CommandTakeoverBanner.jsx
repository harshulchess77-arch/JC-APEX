import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useRealtimeTelemetry, COMMAND_STATUS } from '@/hooks/useRealtimeTelemetry';

export default function CommandTakeoverBanner() {
  const { incomingCommands, sendAck } = useRealtimeTelemetry('driver');
  const [visible, setVisible] = useState(false);
  const ackingRef = useRef(false);

  const current = incomingCommands[0]; // Most recent command

  useEffect(() => {
    if (current && current.status === COMMAND_STATUS.ACKNOWLEDGED) {
      setVisible(false);
    } else if (current && current.status === COMMAND_STATUS.DELIVERED) {
      setVisible(true);
    }
  }, [current]);

  const ack = async () => {
    if (!current || ackingRef.current) return;
    ackingRef.current = true;
    sendAck(current.id, current.payload);
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