import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

export default function OraclePanel({ messages }) {
  return (
    <div className="rounded border border-border bg-card/30 p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono tracking-[0.2em] text-primary uppercase font-bold">
          Oracle Core v2
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-red ml-auto" />
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded text-xs font-mono border ${
                msg.severity === 'critical'
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : msg.severity === 'warning'
                  ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500'
                  : 'border-green-500/30 bg-green-500/5 text-green-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  msg.severity === 'critical' ? 'bg-primary' : 
                  msg.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="opacity-60">{msg.time}</span>
              </div>
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}