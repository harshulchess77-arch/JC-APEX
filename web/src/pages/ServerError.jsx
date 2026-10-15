import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServerError() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Pulsing warning circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-[#FFB300]/20 rounded-full"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: [0, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
            style={{ width: '280px', height: '280px' }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Error code */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[120px] md:text-[180px] font-display font-black text-[#FFB300] leading-none mb-4"
            style={{ textShadow: '0 0 60px rgba(255,179,0,0.5)' }}
          >
            500
          </motion.div>

          {/* Error message */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-4xl font-display font-bold text-white mb-4"
          >
            SYSTEM MALFUNCTION
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/50 text-sm md:text-base mb-8 max-w-md mx-auto"
          >
            The telemetry system encountered an unexpected error. Our team has been notified and is working to restore service.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FFB300] text-black hover:bg-[#FFB300]/90 transition-all"
              style={{ boxShadow: '0 0 30px rgba(255,179,0,0.3)' }}
            >
              <RefreshCw size={18} />
              <span className="font-display font-semibold">Try Again</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <Home size={18} />
              <span className="font-display font-semibold">Return Home</span>
            </button>
          </motion.div>

          {/* Tech specs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 pt-8 border-t border-white/5"
          >
            <div className="flex items-center justify-center gap-2 text-white/20 text-xs font-mono">
              <AlertTriangle size={14} />
              <span>ERROR_CODE: INTERNAL_SERVER_ERROR</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
