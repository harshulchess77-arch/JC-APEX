import React, { useState } from 'react';
import { Radio, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommsPanel({ messages, onSendCommand }) {
  const [command, setCommand] = useState('');

  const handleSend = () => {
    if (!command.trim()) return;
    onSendCommand(command);
    setCommand('');
  };

  return (
    <div className="rounded border border-border bg-card/30 p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono tracking-[0.2em] text-primary uppercase font-bold">
          Pit Comms
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-auto" />
        <span className="text-[10px] font-mono text-green-500">LIVE</span>
      </div>

      <div className="flex-1 space-y-1.5 max-h-[200px] overflow-y-auto mb-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs font-mono p-2 rounded ${
                msg.from === 'pit'
                  ? 'bg-primary/5 border border-primary/20 text-primary'
                  : 'bg-secondary/50 text-muted-foreground'
              }`}
            >
              <span className="opacity-50">[{msg.time}]</span>{' '}
              <span className="font-bold">{msg.from === 'pit' ? 'PIT' : 'SYS'}:</span>{' '}
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Enter command..."
          className="flex-1 px-3 py-2 rounded border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}