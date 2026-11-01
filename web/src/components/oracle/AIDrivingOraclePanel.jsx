/**
 * ============================================================================
 * JC-APEX AI DRIVING ORACLE UI COMPONENT
 * ============================================================================
 * F1-style display for AI ORACLE recommendations on Pit Center and Driver HUD
 * 
 * COLOR CODING:
 * - Cyan (#00FFFF): Advisory pacing recommendations
 * - Amber (#FFB300): Strategic shifts
 * - Red (#FF0033): Critical safety/energy interventions
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Cloud, Gauge, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAIDrivingOracle, ORACLE_SEVERITY } from '@/hooks/useAIDrivingOracle';

const SEVERITY_ICONS = {
  [ORACLE_SEVERITY.NOMINAL]: CheckCircle,
  [ORACLE_SEVERITY.ADVISORY]: Zap,
  [ORACLE_SEVERITY.STRATEGIC]: Gauge,
  [ORACLE_SEVERITY.CRITICAL]: AlertTriangle
};

const CATEGORY_ICONS = {
  energy: Zap,
  weather: Cloud,
  sector: Gauge,
  pit: AlertTriangle
};

export default function AIDrivingOraclePanel({ sessionId = 'race-session-48v', compact = false }) {
  const {
    recommendations,
    latestRecommendation,
    isConnected,
    getSeverityColors,
    ORACLE_SEVERITY
  } = useAIDrivingOracle(sessionId, true);

  const [expanded, setExpanded] = useState(false);

  if (!latestRecommendation && !compact) {
    return (
      <div className="rounded border border-white/[0.06] bg-[#101217] p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-3 h-3 text-[#00FFFF]" />
            <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">
              AI ORACLE
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FFFF] animate-pulse' : 'bg-white/20'}`} />
        </div>
        <div className="text-center py-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF]/30 mx-auto mb-2" />
          <p className="text-[8px] font-mono text-white/15">No recommendations</p>
        </div>
      </div>
    );
  }

  if (compact && latestRecommendation) {
    const colors = getSeverityColors(latestRecommendation.severity);
    const SeverityIcon = SEVERITY_ICONS[latestRecommendation.severity] || AlertTriangle;
    const CategoryIcon = CATEGORY_ICONS[latestRecommendation.category] || Brain;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded border p-2 ${colors.bg} ${colors.border}`}
      >
        <div className="flex items-center gap-2">
          <CategoryIcon className={`w-3 h-3 ${colors.text}`} />
          <span className={`text-[8px] font-display font-bold tracking-wider uppercase ${colors.text}`}>
            {latestRecommendation.message}
          </span>
          <div className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold ${colors.badge}`}>
            {latestRecommendation.severity}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded border border-white/[0.06] bg-[#101217] p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-3 h-3 text-[#00FFFF]" />
          <span className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase">
            AI ORACLE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FFFF] animate-pulse' : 'bg-white/20'}`} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[7px] font-mono text-white/20 hover:text-white/40 transition-colors cursor-pointer"
          >
            {expanded ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>
      </div>

      {/* Latest Recommendation */}
      {latestRecommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-3 p-3 rounded border ${getSeverityColors(latestRecommendation.severity).bg} ${getSeverityColors(latestRecommendation.severity).border}`}
        >
          <div className="flex items-start gap-3">
            {(() => {
              const SeverityIcon = SEVERITY_ICONS[latestRecommendation.severity] || AlertTriangle;
              return <SeverityIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${getSeverityColors(latestRecommendation.severity).text}`} />;
            })()}
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-mono tracking-widest ${getSeverityColors(latestRecommendation.severity).text} uppercase font-bold mb-1`}>
                {latestRecommendation.category} · {latestRecommendation.severity}
              </div>
              <div className={`text-sm md:text-base font-display font-black tracking-wider ${getSeverityColors(latestRecommendation.severity).text} mb-2`}>
                {latestRecommendation.message}
              </div>
              {latestRecommendation.metadata && Object.keys(latestRecommendation.metadata).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(latestRecommendation.metadata).map(([key, value]) => (
                    <div key={key} className={`px-2 py-0.5 rounded text-[7px] font-mono ${getSeverityColors(latestRecommendation.severity).badge}`}>
                      {key}: {value}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`px-2 py-1 rounded text-[8px] font-mono font-bold ${getSeverityColors(latestRecommendation.severity).badge}`}>
              {(latestRecommendation.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </motion.div>
      )}

      {/* History (when expanded) */}
      {expanded && recommendations.length > 1 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recommendations.slice(1).map((rec, index) => {
            const colors = getSeverityColors(rec.severity);
            const SeverityIcon = SEVERITY_ICONS[rec.severity] || AlertTriangle;
            
            return (
              <motion.div
                key={rec.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-2 rounded border ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-center gap-2">
                  <SeverityIcon className={`w-3 h-3 ${colors.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[8px] font-display font-bold tracking-wider ${colors.text} truncate`}>
                      {rec.message}
                    </div>
                    <div className={`text-[7px] font-mono ${colors.text}/60`}>
                      {rec.category} · {rec.severity}
                    </div>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded text-[7px] font-mono ${colors.badge}`}>
                    {(rec.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
