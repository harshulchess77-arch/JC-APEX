import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, AlertTriangle, X } from 'lucide-react';
import { useAIOracle, getAIColor, getAIBackground, AI_PRIORITY, AI_CATEGORY } from '@/hooks/useAIOracle';

export default function AIRecommendationOverlay() {
  const { recommendations, dismissRecommendation } = useAIOracle('driver');
  const [visible, setVisible] = useState(false);
  const [currentRec, setCurrentRec] = useState(null);
  const [autoHideTimeout, setAutoHideTimeout] = useState(null);

  // Show highest priority recommendation
  useEffect(() => {
    if (recommendations.length === 0) {
      setVisible(false);
      setCurrentRec(null);
      return;
    }

    // Get highest priority recommendation
    const sorted = [...recommendations].sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const topRec = sorted[0];

    // Only show if actionable and not already shown
    if (topRec.actionable && topRec.id !== currentRec?.id) {
      setCurrentRec(topRec);
      setVisible(true);

      // Auto-hide after 8 seconds for LOW/MEDIUM, 12 seconds for HIGH, 15 seconds for CRITICAL
      const hideDelay = topRec.priority === AI_PRIORITY.CRITICAL ? 15000 :
                        topRec.priority === AI_PRIORITY.HIGH ? 12000 : 8000;

      if (autoHideTimeout) clearTimeout(autoHideTimeout);
      const timeout = setTimeout(() => {
        setVisible(false);
      }, hideDelay);
      setAutoHideTimeout(timeout);
    }
  }, [recommendations, currentRec, autoHideTimeout]);

  const handleDismiss = () => {
    if (currentRec) {
      dismissRecommendation(currentRec.id);
    }
    setVisible(false);
    if (autoHideTimeout) clearTimeout(autoHideTimeout);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case AI_CATEGORY.ENERGY:
        return <Zap className="w-5 h-5" />;
      case AI_CATEGORY.STRATEGY:
        return <Brain className="w-5 h-5" />;
      case AI_CATEGORY.SAFETY:
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  if (!visible || !currentRec) return null;

  const color = getAIColor(currentRec.priority);
  const bgClass = getAIBackground(currentRec.priority);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9998] max-w-lg w-full mx-4 p-4 border-2 rounded-xl shadow-2xl cursor-pointer ${bgClass}`}
          onClick={handleDismiss}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`p-3 rounded-lg bg-black/30`} style={{ color }}>
              {getCategoryIcon(currentRec.category)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color }}>
                  AI ORACLE
                </span>
                <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold tracking-wider ${bgClass}`} style={{ color }}>
                  {currentRec.priority}
                </span>
              </div>

              <div className={`text-xl md:text-2xl font-display font-black tracking-wide leading-tight mb-2`} style={{ color }}>
                {currentRec.message}
              </div>

              {currentRec.target_value && (
                <div className="text-[10px] font-mono text-white/60">
                  Target: {currentRec.target_value.toFixed(2)}
                </div>
              )}

              {currentRec.confidence > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${currentRec.confidence * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-white/60">
                    {(currentRec.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="p-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Pulse indicator for critical recommendations */}
          {currentRec.priority === AI_PRIORITY.CRITICAL && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ borderColor: color }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
