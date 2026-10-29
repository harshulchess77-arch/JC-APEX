import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useRealtimeTelemetry, COMMAND_STATUS } from '@/hooks/useRealtimeTelemetry';

// F1-style color configurations for command categories
const COMMAND_CATEGORY_COLORS = {
  QUICK_COMMAND: {
    bg: 'bg-[#00FFFF]/20',
    border: 'border-[#00FFFF]',
    text: 'text-[#00FFFF]',
    btnBg: 'bg-[#00FFFF]',
    btnText: 'text-black',
    pulse: 'bg-[#00FFFF]'
  },
  RACE_CONTROL: {
    bg: 'bg-[#FF0033]/20',
    border: 'border-[#FF0033]',
    text: 'text-[#FF0033]',
    btnBg: 'bg-[#FF0033]',
    btnText: 'text-white',
    pulse: 'bg-[#FF0033]'
  },
  RACE_STRATEGY: {
    bg: 'bg-[#FFB300]/20',
    border: 'border-[#FFB300]',
    text: 'text-[#FFB300]',
    btnBg: 'bg-[#FFB300]',
    btnText: 'text-black',
    pulse: 'bg-[#FFB300]'
  },
  DEFAULT: {
    bg: 'bg-[#FF0033]/20',
    border: 'border-[#FF0033]',
    text: 'text-[#FF0033]',
    btnBg: 'bg-[#FF0033]',
    btnText: 'text-white',
    pulse: 'bg-[#FF0033]'
  }
};

// Determine command category based on payload text
const getCommandCategory = (commandText) => {
  const upper = String(commandText || '').toUpperCase();
  
  if (upper.includes('BOX') || upper.includes('PUSH') || upper.includes('HARD')) {
    return 'RACE_CONTROL';
  }
  if (upper.includes('TARGET') || upper.includes('SAVE') || upper.includes('PACE')) {
    return 'RACE_STRATEGY';
  }
  if (upper.includes('ACK') || upper.includes('STATUS')) {
    return 'QUICK_COMMAND';
  }
  
  return 'DEFAULT';
};

export default function GlobalCommandOverlay() {
  const { incomingCommands, sendAck } = useRealtimeTelemetry('driver');
  const [visible, setVisible] = useState(false);
  const [ackTimeoutId, setAckTimeoutId] = useState(null);

  const activeCmd = incomingCommands[0];
  const cmdPayloadText = activeCmd
    ? (activeCmd.payload || activeCmd.commandText || activeCmd.command_name || activeCmd.text || activeCmd.type || 'INCOMING COMMAND')
    : '';

  const category = getCommandCategory(cmdPayloadText);
  const colors = COMMAND_CATEGORY_COLORS[category] || COMMAND_CATEGORY_COLORS.DEFAULT;

  // Show overlay when new command arrives (status: DELIVERED)
  useEffect(() => {
    if (activeCmd && activeCmd.status === COMMAND_STATUS.DELIVERED) {
      setVisible(true);
      
      // Auto-hide after 30 seconds if not acknowledged
      if (ackTimeoutId) clearTimeout(ackTimeoutId);
      const timeoutId = setTimeout(() => {
        setVisible(false);
      }, 30000);
      setAckTimeoutId(timeoutId);
    } else if (activeCmd && activeCmd.status === COMMAND_STATUS.ACKNOWLEDGED) {
      setVisible(false);
    } else if (activeCmd && activeCmd.status === COMMAND_STATUS.EXPIRED) {
      setVisible(false);
    }
  }, [activeCmd, ackTimeoutId]);

  const handleAck = () => {
    if (!activeCmd) return;
    sendAck(activeCmd.id, cmdPayloadText);
    setVisible(false);
    if (ackTimeoutId) clearTimeout(ackTimeoutId);
  };

  return (
    <AnimatePresence>
      {visible && activeCmd && activeCmd.status !== COMMAND_STATUS.ACKNOWLEDGED && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[9999] p-4 border-b-4 cursor-pointer shadow-2xl transition-all ${colors.bg} ${colors.border}`}
          onClick={handleAck}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Category Badge */}
              <div className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-widest uppercase ${colors.btnBg} ${colors.btnText}`}>
                {category.replace('_', ' ')}
              </div>
              
              {/* Animated Pulse Indicator */}
              <div className={`w-4 h-4 rounded-full animate-pulse ${colors.pulse}`} />
              
              {/* Command Text */}
              <div>
                <div className={`text-[11px] font-mono tracking-widest ${colors.text} uppercase font-bold mb-1`}>
                  {activeCmd.sender || 'PIT'} COMMAND DIRECTIVE
                </div>
                <div className={`text-2xl md:text-3xl lg:text-4xl font-display font-black tracking-wider ${colors.text}`}>
                  {cmdPayloadText}
                </div>
              </div>
            </div>

            {/* Acknowledge Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAck();
              }}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl border-2 text-base md:text-lg font-display font-black tracking-wider shadow-2xl hover:opacity-90 active:scale-95 transition-all cursor-pointer ${colors.btnBg} ${colors.btnText} ${colors.border}`}
            >
              <CheckCircle2 className="w-6 h-6" />
              ACKNOWLEDGE
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
