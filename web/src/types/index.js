/**
 * Type definitions for JC-APEX telemetry platform
 * JSDoc type annotations for JavaScript codebase
 */

/**
 * @typedef {Object} TelemetryData
 * @property {number} current - Current in amps
 * @property {number} voltage - Voltage in volts
 * @property {number} power - Power in watts
 * @property {number} speed - Speed in mph
 * @property {number} speed_hall - Speed from Hall sensor in mph
 * @property {number} speed_gps - Speed from GPS in mph
 * @property {number} battery - Battery percentage (0-100)
 * @property {number} temp - Motor temperature in Celsius
 * @property {number} efficiency - Efficiency percentage
 * @property {number} lap - Current lap number
 * @property {number} totalLaps - Total laps in race
 * @property {number} raceTime - Race time in seconds
 * @property {number} latitude - GPS latitude
 * @property {number} longitude - GPS longitude
 * @property {boolean} gpsFix - GPS fix status
 * @property {number} sats - Number of GPS satellites
 */

/**
 * @typedef {Object} HardwareData
 * @property {number} current - Current in amps
 * @property {number} voltage - Voltage in volts
 * @property {number} power - Power in watts
 * @property {number} speed - Speed in mph
 * @property {number} speedHall - Speed from Hall sensor in mph
 * @property {number} speedGps - Speed from GPS in mph
 * @property {number} latitude - GPS latitude
 * @property {number} longitude - GPS longitude
 * @property {number} sats - Number of GPS satellites
 * @property {boolean} gpsFix - GPS fix status
 * @property {number} rssi - LoRa RSSI in dBm
 * @property {number} snr - LoRa SNR in dB
 * @property {number|string} packetId - Packet ID
 * @property {string} timestamp - ISO timestamp
 * @property {string} sessionId - Session ID
 */

/**
 * @typedef {Object} OracleMessage
 * @property {string} text - Message text
 * @property {'nominal'|'warning'|'critical'} severity - Message severity
 * @property {string} time - Time string
 * @property {number} id - Message ID
 */

/**
 * @typedef {Object} DriverProfile
 * @property {string} id - Driver ID
 * @property {string} name - Driver name
 * @property {string} number - Car number
 * @property {string} status - Status (Active/Inactive)
 * @property {number} [age] - Driver age
 * @property {number} [weight_kg] - Driver weight in kg
 * @property {number} [experience_years] - Years of experience
 * @property {number} wins - Number of wins
 * @property {number} podiums - Number of podiums
 * @property {number} races_entered - Number of races entered
 * @property {string} [best_finish] - Best finish position
 * @property {number} [avg_lap_time] - Average lap time
 * @property {string} [notes] - Notes
 * @property {string} [motor_type] - Motor type
 * @property {number} [battery_capacity] - Battery capacity
 * @property {number} [gear_ratio] - Gear ratio
 * @property {string} [tire_type] - Tire type
 * @property {string} [wheel_size] - Wheel size
 * @property {string} [aero_config] - Aero configuration
 * @property {string} [setup_notes] - Setup notes
 */

/**
 * @typedef {Object} SessionData
 * @property {string} sessionId - Session ID
 * @property {string} role - User role (pit/driver/director/demo)
 * @property {string} userRole - User role (same as role)
 * @property {boolean} isDemoMode - Whether in demo mode
 * @property {boolean} isAuthed - Whether authenticated
 * @property {string} route - Route
 * @property {number} timestamp - Timestamp
 */

/**
 * @typedef {Object} ChartDataPoint
 * @property {string} time - Time string
 * @property {number} current - Current in amps
 * @property {number} voltage - Voltage in volts
 * @property {number} power - Power in watts
 * @property {number} speed - Speed in mph
 * @property {number} speed_hall - Speed from Hall sensor in mph
 * @property {number} speed_gps - Speed from GPS in mph
 * @property {number} battery - Battery percentage
 * @property {number} temp - Temperature in Celsius
 * @property {number} efficiency - Efficiency percentage
 */

/**
 * @typedef {Object} Command
 * @property {string} id - Command ID
 * @property {string} commandText - Command text
 * @property {string} status - Command status (PENDING/ACKNOWLEDGED/EXPIRED)
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} LapData
 * @property {string} id - Lap ID
 * @property {number} lap_number - Lap number
 * @property {string} car - Car identifier
 * @property {string} car_name - Car name
 * @property {string} car_number - Car number
 * @property {number} lap_time - Lap time in seconds
 * @property {number} gap - Gap to leader in seconds
 * @property {string} session_id - Session ID
 */

/**
 * @typedef {Object} CommsMessage
 * @property {string} id - Message ID
 * @property {string} session_id - Session ID
 * @property {string} sender - Sender name
 * @property {string} text - Message text
 * @property {string} [audio_url] - Audio URL
 * @property {string} type - Message type (text/audio)
 * @property {string} created_date - ISO timestamp
 */
