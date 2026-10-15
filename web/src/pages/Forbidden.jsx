import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Lock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Forbidden() {
  const navigate = useNavigate();

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

      {/* Lock shield animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="relative"
        >
          <div className="absolute inset-0 border-2 border-dashed border-[#ef4444]/20 rounded-full" style={{ width: '350px', height: '350px' }} />
        </motion.div>
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
            className="text-[120px] md:text-[180px] font-display font-black text-[#ef4444] leading-none mb-4"
            style={{ textShadow: '0 0 60px rgba(239,68,68,0.5)' }}
          >
            403
          </motion.div>

          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/30">
              <Lock size={40} className="text-[#ef4444]" />
            </div>
          </motion.div>

          {/* Error message */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-4xl font-display font-bold text-white mb-4"
          >
            ACCESS DENIED
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/50 text-sm md:text-base mb-8 max-w-md mx-auto"
          >
            You don't have the required credentials to access this area. Please log in with the appropriate role passcode.
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ef4444] text-white hover:bg-[#ef4444]/90 transition-all"
              style={{ boxShadow: '0 0 30px rgba(239,68,68,0.3)' }}
            >
              <ShieldAlert size={18} />
              <span className="font-display font-semibold">Go to Login</span>
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
            transition={{ delay: 0.7 }}
            className="mt-12 pt-8 border-t border-white/5"
          >
            <div className="flex items-center justify-center gap-2 text-white/20 text-xs font-mono">
              <ShieldAlert size={14} />
              <span>ERROR_CODE: FORBIDDEN_INSUFFICIENT_PERMISSIONS</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
