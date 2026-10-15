import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

export const telemetryService = {
  /**
   * Fetch session telemetry data
   */
  async fetchSessionData(sessionId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching session data:', error);
      return [];
    }
  },

  /**
   * Fetch calculated session metrics
   */
  async fetchSessionMetrics(sessionId) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_session_metrics', { session_id_param: sessionId });

      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      logger.error('Error fetching session metrics:', error);
      return null;
    }
  },

  /**
   * Fetch all available sessions
   */
  async fetchAvailableSessions() {
    try {
      const { data, error } = await supabase
        .from('telemetry_logs')
        .select('session_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionMap = new Map();
      (data || []).forEach(record => {
        if (!sessionMap.has(record.session_id)) {
          sessionMap.set(record.session_id, record.created_at);
        }
      });

      const sessions = Array.from(sessionMap.entries())
        .map(([sessionId, createdAt]) => ({ sessionId, createdAt }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return sessions;
    } catch (error) {
      logger.error('Error fetching available sessions:', error);
      return [];
    }
  },

  /**
   * Calculate battery percentage from voltage (48V Li-ion pack)
   * ~42.0V (0%) to ~54.6V (100%)
   */
  calculateBatteryPercentage(voltage) {
    if (voltage <= 30.0) return 0;
    return Math.max(0, Math.min(100, Math.round(((voltage - 42.0) / (54.6 - 42.0)) * 100)));
  },

  /**
   * Calculate efficiency based on speed
   */
  calculateEfficiency(speed) {
    if (speed <= 0) return 0;
    return Math.min(100, Math.round((speed / 35.0) * 100));
  },

  /**
   * Determine thermal alert level
   */
  getThermalAlert(temp) {
    if (temp > 58) return { level: 'critical', color: '#FF1E42', flashing: true };
    if (temp > 46) return { level: 'warning', color: '#FFB300', flashing: false };
    return { level: 'nominal', color: '#10B981', flashing: false };
  },

  /**
   * Determine voltage alert level
   */
  getVoltageAlert(voltage) {
    if (voltage < 42.0 && voltage > 0) return { level: 'critical', color: '#FF1E42', flashing: true };
    if (voltage < 45.0 && voltage > 0) return { level: 'warning', color: '#FFB300', flashing: false };
    return { level: 'nominal', color: '#10B981', flashing: false };
  },
};
