/**
 * JC-APEX Telemetry Service
 * Calculates battery percentage and efficiency from raw telemetry data
 */

export const telemetryService = {
  /**
   * Calculate battery percentage from voltage (48V Li-ion pack)
   * Range: 42.0V (0%) to 54.6V (100%)
   * @param {number} voltage - Battery voltage in volts
   * @returns {number} Battery percentage (0-100)
   */
  calculateBatteryPercentage(voltage) {
    if (!voltage || voltage <= 0) return 0;
    const minVoltage = 42.0;
    const maxVoltage = 54.6;
    const clampedVoltage = Math.max(minVoltage, Math.min(maxVoltage, voltage));
    const percentage = ((clampedVoltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
    return Math.round(percentage);
  },

  /**
   * Calculate efficiency from speed and power
   * Efficiency = (speed in mph * 1.609 km/mile) / (power in watts / 1000) = km/kWh
   * @param {number} speed - Speed in mph
   * @param {number} power - Power in watts
   * @returns {number} Efficiency percentage (0-100, normalized)
   */
  calculateEfficiency(speed, power) {
    if (!speed || !power || power <= 0) return 0;
    const speedKmh = speed * 1.609;
    const powerKw = power / 1000;
    const kmPerKwh = speedKmh / powerKw;
    // Normalize to 0-100 scale (50 km/kWh = 100% efficiency)
    const efficiency = Math.min(100, (kmPerKwh / 50) * 100);
    return Math.round(efficiency);
  },

  /**
   * Format time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const s = typeof seconds === 'number' ? seconds : 0;
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  },

  /**
   * Format speed with unit
   * @param {number} speed - Speed in mph
   * @param {string} unit - Unit ('mph' or 'kph')
   * @returns {number} Formatted speed
   */
  formatSpeed(speed, unit = 'mph') {
    if (!speed) return 0;
    if (unit === 'kph') {
      return Math.round(speed * 1.609);
    }
    return speed;
  },
};
