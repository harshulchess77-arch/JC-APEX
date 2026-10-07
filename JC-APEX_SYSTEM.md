# JC-APEX TELEMETRY SYSTEM - MASTER DOCUMENTATION

**Electrothon 48V EV Telemetry Platform**
**Version: 2.1 | Last Updated: 2026-10-07**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Hardware Specifications](#2-hardware-specifications)
3. [Microcontroller Firmware](#3-microcontroller-firmware)
4. [Python Gateway Pipeline](#4-python-gateway-pipeline)
5. [Database Schema](#5-database-schema)
6. [Web Dashboard](#6-web-dashboard)
7. [Installation & Deployment](#7-installation--deployment)
8. [Pre-Race Checklist](#8-pre-race-checklist)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project Overview

### System Architecture

JC-APEX is an end-to-end real-time hardware telemetry platform for Electrothon 48V electric competition vehicles. The system uses dual Heltec V3 ESP32-S3 SX1262 LoRa modules for wireless telemetry transmission, WCS1600 Hall Effect current sensors for power monitoring, GPS for vehicle tracking, and a Supabase-backed React dashboard for real-time race control.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELECTROTHON 48V VEHICLE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ 48V Battery  │───▶│  Hall Effect  │───▶│  WCS1600     │              │
│  │  (820k/47k)  │    │   Speed       │    │  Current      │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│        │                   │                   │                         │
│        ▼                   ▼                   ▼                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              HELTEC V3 TX (ESP32-S3 + SX1262 LoRa)          │   │
│  │  • GPIO 19: 48V Voltage (820kΩ/47kΩ divider)              │   │
│  │  • GPIO 1: WCS1600 Current Sensor (ADC1_CH0)              │   │
│  │  • GPIO 7: Hall Effect Speed Sensor (INPUT_PULLUP)        │   │
│  │  • GPIO 17/15: GPS UART (RX/TX @ 9600 baud)              │   │
│  │  • EMA Filter: ALPHA = 0.25                               │   │
│  │  • Auto-Calibration: 100 samples @ boot                  │   │
│  │  • TX Rate: 5 Hz (200ms intervals)                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    ▼ (915 MHz LoRa)                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              HELTEC V3 RX (ESP32-S3 + SX1262 LoRa)          │   │
│  │  • Receives packets via DIO1 interrupt                       │   │
│  │  • Outputs JSON via USB (CP2102) @ 115200 baud              │   │
│  │  • Auto-scales uncalibrated TX voltage                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    ▼ USB Serial                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              PYTHON BRIDGE (PC/Gateway)                       │   │
│  │  • bridge_online.py: Serial → Supabase Realtime               │   │
│  │  • bridge_offline.py: Serial → CSV (field mode)              │   │
│  │  • CSV backup: session_YYYYMMDD_HHMMSS.csv                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    ▼ HTTPS                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              SUPABASE CLOUD DATABASE                         │   │
│  │  • telemetry_logs table (INSERT events)                     │   │
│  │  • Realtime publication enabled                               │   │
│  │  • Row Level Security (RLS) policies                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                      │
│                                    ▼ WebSocket                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              REACT DASHBOARD (Vercel)                         │   │
│  │  • useTelemetry hook: Supabase Realtime subscription           │   │
│  │  • F1-style Race Control UI                                    │   │
│  │  • Pit Center, Driver HUD, Race Director                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Repository Structure

```
/
├── firmware/
│   ├── transmitter/
│   │   └── transmitter.ino          # Heltec V3 TX firmware
│   └── receiver/
│       └── receiver.ino             # Heltec V3 RX firmware
├── gateway/
│   ├── bridge_online.py             # Live Serial-to-Supabase bridge
│   ├── bridge_offline.py            # Field Serial-to-CSV logger
│   ├── run_bridge.py                # Auto-restart runner
│   ├── sync_offline_data.py         # CSV-to-Supabase sync script
│   ├── mock_simulator.py            # Hardware simulator for testing
│   ├── test_integration.py          # Integration test script
│   └── requirements.txt             # Python dependencies
├── database/
│   ├── schema.sql                   # Complete database schema
│   ├── migration_electrothon_48v.sql # 48V telemetry migration
│   └── enable_realtime.sql          # Realtime enablement
├── web/                             # React/Vite application
│   ├── src/
│   │   ├── pages/                   # Route components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── components/              # UI components
│   │   └── lib/                     # Utility libraries
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json                  # Vercel deployment config
├── vercel.json                      # Root Vercel config
├── JC-APEX_SYSTEM.md                # This master document
└── README.md                        # Quick start guide
```

---

## 2. Hardware Specifications

### 2.1 Heltec V3 ESP32-S3 + SX1262 LoRa Module

**Transmitter (TX) Hardware:**
- MCU: ESP32-S3 (dual-core Xtensa LX7, 240 MHz)
- LoRa: Semtech SX1262
- Frequency: 915.0 MHz (US915 Band)
- Bandwidth: 125 kHz
- Spreading Factor: 7 (SF7 - high speed)
- Coding Rate: 4/5 (CR5)
- Sync Word: 0x12 (private network)
- TX Power: 22 dBm
- Preamble Length: 8 symbols
- Range: Up to 15 km (line of sight, SF7)

**Receiver (RX) Hardware:**
- Same hardware configuration as TX
- Additional: USB-C CP2102 UART bridge for PC connection
- Serial Baud: 115200

### 2.2 48V Battery Voltage Monitoring

**Voltage Divider Circuit:**
- R1 (positive side): 820 kΩ (820,000 Ω)
- R2 (ground side): 47 kΩ (47,000 Ω)
- Division Ratio: (820 + 47) / 47 = 18.4468
- **Calibrated Ratio:** 20.24 (calibrated against multimeter: 56.0V actual / 51.0V software)
- Pin: ESP32 GPIO 19 (ADC1_CH7)
- ADC Attenuation: ADC_11db (full-scale ~3.3V)

**Equation:**
```
trueVoltage = (ADC_Value × 3.3 / 4095.0) × 125.08
```

**Wiring:**
```
48V Battery (+) ──► R1 (820kΩ) ──► GPIO 19
                      │
                      └─► R2 (47kΩ) ──► GND
48V Battery (-) ──► ESP32 GND (CRITICAL: Common Ground)
```

### 2.3 WCS1600 Hall Effect Current Sensor

**Sensor Specifications:**
- Supply Voltage: 5.0 V
- Sensitivity: 22 mV/A (0.022 V/A)
- Zero-current output: 2.5 V at 5V supply
- Operating Range: ±75 A
- Response Time: < 3 μs

**Voltage Divider Circuit (for ESP32 ADC safety):**
- R1 (line series): 10 kΩ
- R2 (pull-down to GND): 18 kΩ
- Division Factor: (10 + 18) / 18 = 1.5556
- Scaled max output: 5.0 V × 1.5556 = 7.78 V (exceeds 3.3V - need recalculation)
- **Corrected Division:** Use divider to scale 5V max to 3.3V max
- R1 = 10kΩ, R2 = 18kΩ is for different configuration
- Actual firmware uses: R1 = 10kΩ, R2 = 18kΩ with factor 1.5556

**Wiring:**
```
WCS1600 Sensor
├── VCC  ──► 5V (USB power bank)
├── GND  ──► GND (Common ground with ESP32)
└── VOUT ──► R1 (10kΩ) ──► GPIO 1 (ADC1_CH0)
                │
                └─► R2 (18kΩ) ──► GND
```

**Current Calculation Formula:**
```
V_ADC = ADC_Value × (3.3 / 4095.0)
V_sensor = V_ADC × 1.5556
I_amps = (V_sensor - zeroCurrentOffsetVolts) × 1000 / 22.0
```

Where:
- `zeroCurrentOffsetVolts`: Auto-calibrated at boot (100 samples)
- 22.0: Sensitivity in mV/A
- 1000: Convert mV to V

### 2.4 Hall Effect Speed Sensor

**Specifications:**
- Sensor Type: Hall Effect (magnetic proximity)
- Pin: ESP32 GPIO 7 (INPUT_PULLUP)
- Interrupt: FALLING edge detection
- Pulses per Revolution: 1 (1 magnet on wheel)
- Wheel Circumference: 1.55 meters (~20-inch Electrothon wheel)
- Gear Ratio: 1.0 (sensor on wheel hub)

**Speed Calculation:**
```
wheel_RPM = (deltaPulses / pulses_per_rev) × (60000 / dt_ms) / gear_ratio
speed_mps = (wheel_RPM × circumference_m) / 60
speed_mph = speed_mps × 2.23694
```

**Wiring:**
```
Hall Sensor
├── VCC  ──► 3.3V
├── GND  ──► GND
└── OUT  ──► GPIO 7 (INPUT_PULLUP)
```

### 2.5 GPS Module

**Specifications:**
- Hardware UART: Serial1
- RX Pin: GPIO 17
- TX Pin: GPIO 15
- Baud Rate: 9600
- Protocol: NMEA 0183
- Library: TinyGPS++

**Wiring:**
```
GPS Module
├── VCC  ──► 3.3V
├── GND  ──► GND
├── TX   ──► GPIO 17 (ESP32 RX)
└── RX   ──► GPIO 15 (ESP32 TX)
```

### 2.6 Onboard OLED Display

**Specifications:**
- Controller: SSD1306
- Resolution: 128 × 64 pixels
- Interface: I2C
- SDA Pin: GPIO 41 (TX), GPIO 17 (RX)
- SCL Pin: GPIO 42 (SCK), GPIO 18 (SCK)
- RST Pin: GPIO 21
- VEXT Pin: GPIO 36 (power control)

**Power Control:**
- VEXT_PIN LOW = Power ON
- VEXT_PIN HIGH = Power OFF

---

## 3. Microcontroller Firmware

### 3.1 Transmitter Firmware (`firmware/transmitter/transmitter.ino`)

**Key Features:**
- 5 Hz transmission rate (200ms intervals)
- EMA filtering for current sensor (ALPHA = 0.25)
- Auto-calibration of WCS1600 zero-current baseline (100 samples @ boot)
- Non-blocking GPS parsing via TinyGPS++
- Hardware interrupt for Hall sensor (debounce: 3ms)
- CSV payload format: `packet_id,amps,volts,watts,speed_hall,speed_gps`

**Calibration Constants:**
```cpp
const float BATT_VOLTAGE_DIVIDER_FACTOR = 125.08f;  // Calibrated: 20.24 * (55.0 / 8.9)
const float CURRENT_EMA_ALPHA = 0.25f;              // EMA filter coefficient
const float CURRENT_SENSITIVITY_MV_PER_AMP = 22.0f; // WCS1600 sensitivity
```

**ADC Configuration:**
```cpp
analogSetPinAttenuation(CURRENT_SENSOR_PIN, ADC_11db);    // GPIO 1
analogSetPinAttenuation(BATTERY_VOLTAGE_PIN, ADC_11db);   // GPIO 19
```

**Pin Configuration:**
```cpp
#define CURRENT_SENSOR_PIN    1   // GPIO 1 (ADC1_CH0)
#define BATTERY_VOLTAGE_PIN   19  // GPIO 19
#define HALL_SENSOR_PIN       7   // GPIO 7
#define GPS_RX_PIN            17  // GPIO 17
#define GPS_TX_PIN            15  // GPIO 15
```

**LoRa Configuration:**
```cpp
#define LORA_FREQ             915.0f  // MHz
#define LORA_BANDWIDTH        125.0f  // kHz
#define LORA_SPREAD_FACTOR    7       // SF7
#define LORA_CODE_RATE        5       // 4/5
#define LORA_SYNC_WORD        0x12    // Private network
#define LORA_TX_POWER         22      // dBm
```

### 3.2 Receiver Firmware (`firmware/receiver/receiver.ino`)

**Key Features:**
- DIO1 interrupt for packet reception
- CSV payload parsing with safe tokenization
- JSON output via USB Serial (115200 baud)
- Auto-scaling of uncalibrated TX voltage (factor: 6.1798)
- RSSI/SNR metrics appended to each packet
- OLED display for live diagnostics

**JSON Output Format:**
```json
{
  "id": 1234,
  "amps": 45.20,
  "volts": 49.8,
  "watts": 2250.9,
  "speed_h": 23.4,
  "speed_g": 23.5,
  "rssi": -58,
  "snr": 9.8
}
```

**Key Changes (v2.1):**
- Removed duplicate field names (now uses primary keys only)
- Single-line JSON output without conversational text
- Prevents JSONDecodeError on Python gateway bridges

**Auto-Calibration Logic:**
```cpp
// Auto-scale voltage if transmitter is still sending uncalibrated ~8.9V
if (volts > 0.5f && volts < 15.0f) {
  volts = volts * UNCALIBRATED_TX_VOLTAGE_FACTOR;  // 6.1798f
}
```

---

## 4. Python Gateway Pipeline

### 4.1 Online Bridge (`gateway/bridge_online.py`)

**Purpose:** Real-time serial-to-Supabase bridge for live race monitoring

**Features:**
- Auto-detects USB serial ports (CP210x, CH340, Heltec)
- CSV backup for data safety
- Supabase REST API integration
- Schema fallback for database compatibility
- Packet gap detection and reporting
- Console telemetry visualizer

**Usage:**
```bash
python bridge_online.py --port COM7           # Windows
python bridge_online.py --port /dev/ttyUSB0   # Linux/macOS
python bridge_online.py                       # Auto-detect
```

**Environment Variables (.env):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**CSV Backup Format:**
```
timestamp,id,volts,amps,watts,speed_h,speed_g,latitude,longitude,rssi,snr
```

**Key Changes (v2.1):**
- Updated CSV headers to match cloud schema
- Removed session_id prefix (using id as primary key)
- Flexible key validation with fallback parsing (amps/current, volts/voltage, etc.)

### 4.2 Offline Bridge (`gateway/bridge_offline.py`)

**Purpose:** Field test serial-to-CSV logger for zero-network environments

**Features:**
- Thread-safe serial reading
- Packet loss detection
- Automatic reconnection
- Full telemetry CSV logging
- Validation error reporting

**Usage:**
```bash
python bridge_offline.py --port COM7
```

**CSV Output:**
```
timestamp,id,volts,amps,watts,speed_h,speed_g,rssi,snr
```

**Key Changes (v2.1):**
- Updated CSV headers to match cloud schema
- Removed session_id prefix
- Auto-reconnect with 2-second backoffs
- Silicon Labs CP210x device prioritization

### 4.3 Data Sync (`gateway/sync_offline_data.py`)

**Purpose:** Post-field CSV-to-Supabase bulk sync

**Features:**
- Batch processing (100 records per batch)
- Data validation
- Progress reporting
- Error handling

**Usage:**
```bash
python sync_offline_data.py --file session_20261007_212855.csv
```

**Key Changes (v2.1):**
- Flexible column mapping (id/packet_id, amps/current, volts/voltage)
- Schema fallback when database columns are missing
- Uploads all extended fields (volts, amps, watts, speed_h, speed_g, rssi, snr)

### 4.4 Mock Simulator (`gateway/mock_simulator.py`)

**Purpose:** Hardware simulator for testing without physical devices

**Features:**
- Realistic 5 Hz telemetry generation
- Console or serial port output
- Sine wave current simulation

**Usage:**
```bash
python mock_simulator.py                    # Console output
python mock_simulator.py --port COM3       # Serial output
```

### 4.5 Auto-Restart Runner (`gateway/run_bridge.py`)

**Purpose:** Production auto-restart wrapper with exponential backoff

**Features:**
- Automatic crash recovery
- Exponential backoff (5s → 60s max)
- Max 10 retry attempts

**Usage:**
```bash
python run_bridge.py
```

### 4.6 Python Dependencies

```txt
pyserial==3.5
requests==2.31.0
python-dotenv==1.0.0
```

---

## 5. Database Schema

### 5.1 Telemetry Logs Table

```sql
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    packet_id BIGINT NOT NULL,
    current NUMERIC(8,2) NOT NULL,
    voltage NUMERIC(8,2) DEFAULT 0.00,
    power NUMERIC(8,2) DEFAULT 0.00,
    speed_hall NUMERIC(8,2) DEFAULT 0.00,
    speed_gps NUMERIC(8,2) DEFAULT 0.00,
    latitude NUMERIC(10,6) DEFAULT 0.00,
    longitude NUMERIC(10,6) DEFAULT 0.00,
    rssi NUMERIC(6,2),
    snr NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_telemetry_session_time
ON public.telemetry_logs (session_id, created_at DESC);
```

### 5.2 Race Management Tables

**Drivers Table:**
```sql
CREATE TABLE drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  number TEXT,
  status TEXT DEFAULT 'Active',
  -- Additional fields...
);
```

**Races Table:**
```sql
CREATE TABLE races (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  circuit_name TEXT,
  date DATE,
  total_laps INTEGER DEFAULT 70,
  status TEXT DEFAULT 'upcoming',
  -- Additional fields...
);
```

**Race Telemetry Logs:**
```sql
CREATE TABLE race_telemetry_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME zone DEFAULT NOW(),
  speed NUMERIC,
  battery NUMERIC,
  temp NUMERIC,
  voltage NUMERIC,
  current NUMERIC,
  efficiency NUMERIC,
  lap NUMERIC,
  race_time INTEGER
);
```

### 5.3 Row Level Security (RLS)

```sql
-- Public telemetry logs policies
CREATE POLICY "public_allow_anon_read" ON public.telemetry_logs
FOR SELECT TO anon USING (true);

CREATE POLICY "public_allow_anon_insert" ON public.telemetry_logs
FOR INSERT TO anon WITH CHECK (true);
```

### 5.4 Realtime Publication

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_logs;
```

### 5.5 Utility Functions

**Session Metrics Calculation:**
```sql
CREATE OR REPLACE FUNCTION calculate_session_metrics(session_id_param TEXT)
RETURNS TABLE (
  session_id TEXT,
  total_records BIGINT,
  peak_current NUMERIC,
  avg_current NUMERIC,
  min_current NUMERIC,
  duration_seconds NUMERIC,
  avg_rssi NUMERIC,
  avg_snr NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tl.session_id,
    COUNT(*) as total_records,
    MAX(tl.current) as peak_current,
    AVG(tl.current) as avg_current,
    MIN(tl.current) as min_current,
    EXTRACT(EPOCH FROM (MAX(tl.created_at) - MIN(tl.created_at))) as duration_seconds,
    AVG(tl.rssi) as avg_rssi,
    AVG(tl.snr) as avg_snr
  FROM public.telemetry_logs tl
  WHERE tl.session_id = session_id_param
  GROUP BY tl.session_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Web Dashboard

### 6.1 Technology Stack

- **Framework:** React 18.2
- **Build Tool:** Vite 6.1
- **UI Library:** Radix UI + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Realtime)
- **Hosting:** Vercel
- **State Management:** React Context + TanStack Query
- **Charts:** Recharts

### 6.2 Key Components

**Custom Hooks:**
- `useTelemetry.js`: Supabase Realtime subscription with demo mode fallback
- `useRealtimeTelemetry.js`: Pit-to-driver command system
- `useRaceEngine.js`: Race state management

**Pages:**
- `/`: Landing page
- `/login`: Role selection (Pit, Driver, Director)
- `/pit`: Pit Center (race control, strategy, telemetry)
- `/driver`: Driver HUD (command acknowledgment, flag display)
- `/director`: Race Director (flag control, incident management)
- `/telemetry-dashboard`: Live telemetry visualization
- `/circuit-map`: GPS track visualization
- `/strategy-library`: Strategy presets and analysis

### 6.3 Telemetry Hook Features

**Live Hardware Mode:**
- Supabase Realtime postgres_changes subscription
- 3000ms zero-baseline watchdog
- Field name fallback for legacy compatibility
- Chart data accumulation (200-point buffer)
- Session history tracking

**Demo Mode:**
- 5 Hz local simulation
- Realistic 48V Electrothon ranges:
  - Voltage: 46V - 53V
  - Amps: 10A - 60A
  - Speed: 15 - 30 MPH
- Strategy multiplier effects
- Flag-based speed limits

**Zero-Baseline Watchdog:**
- Drops all metrics to 0.00 if no packets for 3 seconds
- Prevents stale data display during disconnection

### 6.4 F1-Style UI Design

**Color Palette:**
- Background: Carbon Dark `#0B0E14`
- Nominal: Neon Green `#00FF66`
- Warning: Amber `#F59E0B`
- Critical: Vivid Red `#FF0033`
- Text: White `#FFFFFF`

**Typography:**
- Monospace for telemetry values
- Digital-style speed/power displays
- Delta trend indicators (ΔV, ΔA, ΔW)

**Critical Status Badges:**
- Live Bus Voltage
- Current Draw
- Tractive Power (kW)
- Hall Speed vs. GPS Speed
- RSSI/SNR Signal Quality
- Pit Communications Status
- Flag Status (Green/Yellow/Red/Black)

### 6.5 SPA Routing Configuration

**Vite Config (`vite.config.js`):**
```javascript
export default defineConfig({
  base: '/',
  server: {
    historyApiFallback: true
  }
});
```

**Vercel Config (`vercel.json`):**
```json
{
  "outputDirectory": "web/dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**React Router (`App.jsx`):**
```jsx
<Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<RoleSelect />} />
  <Route element={<PasscodeProtectedRoute />}>
    <Route path="/pit" element={<PitCenter />} />
    <Route path="/driver" element={<DriverHUD />} />
    <Route path="/director" element={<RaceDirector />} />
    {/* Additional protected routes... */}
    <Route path="*" element={<PageNotFound />} />
  </Route>
</Routes>
```

---

## 7. Installation & Deployment

### 7.1 Prerequisites

**Node.js (Frontend):**
- Version: 18.x or 20.x LTS
- Download: https://nodejs.org/

**Python 3.10+ (Gateway):**
- Version: 3.10 or later
- Download: https://www.python.org/

**Arduino IDE (Firmware):**
- Version: 2.x
- Download: https://www.arduino.cc/en/software

**CP210x Drivers (USB Communication):**
- Download: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

### 7.2 Arduino IDE Setup

1. **Add ESP32 Board Support:**
   - File → Preferences → Additional Boards Manager URLs
   - Add: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`

2. **Install ESP32 Board:**
   - Tools → Board → Boards Manager
   - Search: "esp32"
   - Install: "esp32 by Espressif Systems" (v2.0.11+)

3. **Select Board:**
   - Tools → Board → "Heltec WiFi LoRa 32(V3) / Wireless shell(V3)"

4. **Install Libraries:**
   - Tools → Manage Libraries
   - Install: RadioLib, TinyGPSPlus, ArduinoJson, Adafruit SSD1306, Adafruit GFX

### 7.3 Firmware Upload

**Transmitter:**
1. Open `firmware/transmitter/transmitter.ino`
2. Select correct COM port (TX device)
3. Click Upload

**Receiver:**
1. Open `firmware/receiver/receiver.ino`
2. Select correct COM port (RX device - different from TX)
3. Click Upload

### 7.4 Python Gateway Setup

```bash
cd gateway
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

**Create `.env` file:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 7.5 Database Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Create new project
   - Note project URL and API keys

2. **Run SQL Schema:**
   - Navigate to SQL Editor
   - Run `database/schema.sql`
   - Run `database/enable_realtime.sql`

3. **Verify Realtime:**
   - Go to Database → Replication
   - Verify `telemetry_logs` is published

### 7.6 Web Dashboard Setup

```bash
cd web
npm install
```

**Create `.env` file:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Development:**
```bash
npm run dev    # http://localhost:3000
```

**Production Build:**
```bash
npm run build
npm run preview
```

### 7.7 Vercel Deployment

1. **Connect Repository:**
   - Go to Vercel Dashboard
   - Add New Project
   - Import Git repository

2. **Configure Build Settings:**
   - Framework Preset: Vite
   - Root Directory: `web`
   - Output Directory: `dist`

3. **Environment Variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for PDF export)

4. **Deploy:**
   - Click Deploy
   - Vercel will automatically detect `vercel.json` in root

---

## 8. Pre-Race Checklist

### 8.1 Hardware Inspection (2 Minutes)

**Power & Grounding:**
- [ ] 48V Battery voltage > 45V
- [ ] Common ground verified (battery negative → ESP32 GND)
- [ ] All sensor grounds connected to single point
- [ ] No floating ADC pins

**Wiring Verification:**
- [ ] Voltage divider: R1 (820kΩ) to GPIO 19, R2 (47kΩ) to GND
- [ ] Current sensor: VOUT to GPIO 1 via divider
- [ ] Hall sensor: OUT to GPIO 7
- [ ] GPS: TX to GPIO 17, RX to GPIO 15
- [ ] All connections secure (no loose wires)

**Power Supply:**
- [ ] TX powered via USB power bank (5V, 2A minimum)
- [ ] RX powered via laptop USB
- [ ] Power bank charge > 80%

### 8.2 Firmware Verification (1 Minute)

**Transmitter:**
- [ ] TX LED blinking (5 Hz)
- [ ] OLED displays "JC-APEX TX"
- [ ] Serial Monitor shows live output (if connected)

**Receiver:**
- [ ] RX LED blinking on packet reception
- [ ] OLED displays "JC-APEX LoRa RX"
- [ ] USB recognized by laptop (CP210x device)

### 8.3 Gateway Setup (2 Minutes)

**Online Mode:**
```bash
cd gateway
python bridge_online.py --port COM7
```

- [ ] Serial port detected
- [ ] Session ID generated
- [ ] Packets streaming to console
- [ ] CSV backup file created
- [ ] Supabase connection verified

**Offline Mode (Field):**
```bash
python bridge_offline.py --port COM7
```

- [ ] Serial port detected
- [ ] CSV file initialized
- [ ] Packets logging to CSV
- [ ] No validation errors

### 8.4 Dashboard Verification (1 Minute)

**Web Dashboard:**
- [ ] Navigate to Vercel deployment URL
- [ ] Login with passcode
- [ ] Select role (Pit/Driver/Director)
- [ ] Telemetry streaming live
- [ ] RSSI/SNR metrics visible
- [ ] Voltage reading ~56V (calibrated)
- [ ] Current reading realistic (10-60A)

**Signal Quality:**
- [ ] RSSI > -70 dBm (good signal)
- [ ] SNR > 5 dB (acceptable)
- [ ] No packet gaps in console

### 8.5 Final Go/No-Go Decision

**GO Criteria:**
- All hardware checks passed
- Both TX and RX powered and communicating
- Gateway streaming packets
- Dashboard showing live telemetry
- RSSI > -70 dBm
- No validation errors

**NO-GO Triggers:**
- Floating ADC readings
- Common ground not verified
- TX or RX not powered
- No LoRa packets received
- Dashboard showing stale data
- RSSI < -80 dBm

---

## 9. Troubleshooting

### 9.1 No Serial Connection

**Symptoms:**
- `SerialException: could not open port`
- Device not in COM port list

**Solutions:**
1. Verify USB cable is data-capable (not charge-only)
2. Install CP210x drivers
3. Check Device Manager / `ls /dev/tty*`
4. Try different USB port
5. Unplug and replug device

### 9.2 No LoRa Packets

**Symptoms:**
- Console shows "No packets received"
- RX OLED shows 0 packets

**Solutions:**
1. Verify both ESP32s powered on
2. Check frequency matching (915.0 MHz)
3. Ensure RadioLib parameters match (SF7, BW125, CR5)
4. Check antenna connections
5. Reduce distance between TX and RX (test at 1m)
6. Verify sync word (0x12)

### 9.3 Gateway Not Connecting to Supabase

**Symptoms:**
- `[SUPABASE ERROR] Status 401`
- `[SUPABASE ERROR] Status 403`

**Solutions:**
1. Verify `.env` file exists in `gateway/` directory
2. Check SUPABASE_URL and SUPABASE_ANON_KEY
3. Test Supabase connection in dashboard
4. Verify REST endpoint accessibility
5. Check network connectivity

### 9.4 Dashboard Shows Mock Mode

**Symptoms:**
- Telemetry values fluctuating but no hardware connected
- Console shows "Demo mode active"

**Solutions:**
1. Verify gateway is running
2. Check JSON streaming in terminal
3. Check browser console for errors
4. Verify Supabase Realtime enabled for `telemetry_logs`
5. Check session ID filter

### 9.5 Voltage Reading Incorrect

**Symptoms:**
- Dashboard shows 51V but multimeter shows 56V
- Voltage fluctuates wildly

**Solutions:**
1. Verify voltage divider resistors (820kΩ/47kΩ)
2. Check common ground connection
3. Recalibrate `BATT_VOLTAGE_DIVIDER_FACTOR`
4. Verify ADC attenuation (ADC_11db)
5. Check for loose connections

### 9.6 Current Reading Zero or Negative

**Symptoms:**
- Current shows 0.00A when motor running
- Current shows negative values

**Solutions:**
1. Re-run auto-calibration (power cycle TX)
2. Check WCS1600 sensor wiring
3. Verify 5V supply to sensor
4. Check zero-current offset value
5. Verify sensitivity (22 mV/A)

### 9.7 SPA Routing 404 Errors

**Symptoms:**
- Refreshing `/pit` returns 404
- Direct URL access fails

**Solutions:**
1. Verify `vercel.json` in root directory
2. Check `vite.config.js` has `base: '/'`
3. Verify React Router has catch-all route
4. Redeploy to Vercel
5. Clear browser cache

### 9.8 Build Errors

**Symptoms:**
- `npm run build` fails
- TypeScript errors

**Solutions:**
1. Run `npm install` to update dependencies
2. Check for version conflicts in `package.json`
3. Run `npm run lint:fix`
4. Clear node_modules: `rm -rf node_modules && npm install`
5. Check Node.js version (18.x or 20.x)

### 9.9 PDF Export Fails

**Symptoms:**
- PDF download fails
- Server error 500

**Solutions:**
1. Verify session ID exists in database
2. Check Vercel environment variables
3. Verify SUPABASE_SERVICE_ROLE_KEY has write access
4. Check Vercel function logs
5. Ensure session has telemetry data

---

## Appendix D: Version 2.1 Updates (2026-10-07)

### Firmware Changes

**Transmitter (`firmware/transmitter/transmitter.ino`):**
- Updated `BATT_VOLTAGE_DIVIDER_FACTOR` from `20.24f` to `125.08f` (calibrated: 20.24 × (55.0V / 8.9V))
- Confirmed `analogSetPinAttenuation(ADC_11db)` on both GPIO 1 (current) and GPIO 19 (voltage)

**Receiver (`firmware/receiver/receiver.ino`):**
- Simplified JSON output to primary keys only: `{"id", "amps", "volts", "watts", "speed_h", "speed_g", "rssi", "snr"}`
- Removed duplicate field names (packet_id, current, voltage, power, speed_hall, speed_gps)
- Single-line JSON output without conversational text prefix/suffix
- Prevents `JSONDecodeError` on Python gateway bridges
- Retained uncalibrated voltage auto-scaling logic (factor: 6.1798f for volts in 0.5V-15.0V range)

### Gateway Changes

**bridge_online.py:**
- Added flexible key validation with fallback parsing: `data.get("id") or data.get("packet_id", 0)`
- Updated CSV backup headers to: `["timestamp", "id", "volts", "amps", "watts", "speed_h", "speed_g", "latitude", "longitude", "rssi", "snr"]`
- Added auto-reconnect loop with 2-second backoffs
- Prioritizes Silicon Labs CP210x devices in auto-detection
- Updated Supabase payload to use `id` instead of `packet_id`

**bridge_offline.py:**
- Added flexible key validation with fallback parsing
- Updated CSV headers to match cloud schema: `["timestamp", "id", "volts", "amps", "watts", "speed_h", "speed_g", "rssi", "snr"]`
- Enhanced auto-detect to prioritize Silicon Labs CP210x / USB Serial devices
- Added auto-reconnect with 2-second backoffs

**sync_offline_data.py:**
- Added flexible column mapping for CSV parsing (id/packet_id, amps/current, volts/voltage)
- Added schema fallback when database columns are missing
- Updated JSON payload to upload all extended fields (volts, amps, watts, speed_h, speed_g, rssi, snr)
- Changed primary key from `packet_id` to `id`

### Web Dashboard Changes

**F1 Dark Aesthetic Theme (`web/src/index.css`):**
- Updated background to Carbon Dark: `#0B0E14` (215 20% 6%)
- Updated primary to Neon Green: `#00FF66` (142 100% 50%)
- Updated destructive to Vivid Red: `#FF0033` (348 100% 50%)
- Added F1 theme color constants: `--f1-carbon-dark`, `--f1-neon-green`, `--f1-vivid-red`, `--f1-signal-yellow`, `--f1-signal-orange`

**Defensive State Guarding (`web/src/hooks/useTelemetry.js`):**
- Added nullish coalescing fallbacks: `data?.amps ?? data?.current ?? 0`
- Applied to all telemetry fields: amps, volts, watts, speed_h, speed_g, latitude, longitude, rssi, snr
- Prevents React crashes during rapid 5 Hz telemetry updates
- 3000ms zero-baseline watchdog timer already implemented correctly

**TelemetryGauge Component (`web/src/components/command/TelemetryGuage.jsx`):**
- Updated F1 color palette: Vivid Red (#FF0033), Neon Green (#00FF66), Signal Yellow (#FFD600)
- Added defensive fallbacks: `safeValue = value ?? 0`, `safeMax = max ?? 100`, `safeColor = color ?? 'green'`

**LiveChart Component (`web/src/components/command/LiveChart.jsx`):**
- Updated F1 color palette
- Added defensive fallbacks for data, dataKey, color, label
- Updated tooltip background to Carbon Dark (#0B0E14)

**TelemetryDashboard Component (`web/src/pages/TelemetryDashbaord.jsx`):**
- Added live telemetry status badges with icons:
  - Power (kW) with Zap icon
  - Voltage (V) with Battery icon
  - Current (A) with Gauge icon
  - Hall Speed (mph) with Radio icon
  - GPS Speed (mph) with Radio icon
  - RSSI (dBm) with Signal icon - color-coded red if < -70dBm
  - SNR (dB) with Signal icon - color-coded red if < 5dB
- Updated all metric colors to F1 palette
- Changed background to Carbon Dark (#0B0E14)
- Updated LIVE frequency indicator from 20Hz to 5Hz (matches hardware)
- Added defensive fallbacks throughout component

**Build Verification:**
- `npm run build` completed successfully with exit code 0
- Zero JSX/TypeScript compilation errors
- Zero missing imports

---

## Appendix A: Performance Specifications

- **Transmission Rate:** 5 Hz (200ms intervals)
- **LoRa Range:** Up to 15 km (line of sight, SF7)
- **Current Range:** ±75 A (WCS1600 spec)
- **ADC Resolution:** 12-bit (0-4095)
- **Voltage Range:** 0V - 60V (with divider)
- **Speed Range:** 0 - 100 MPH (Hall sensor)
- **GPS Accuracy:** ±2.5m (typical)
- **Database Indexing:** Optimized on session_id and created_at
- **Realtime Latency:** Sub-second updates via postgres_changes
- **CSV Backup:** Local session logging with timestamp
- **Dashboard Refresh:** 200ms (hardware), 200ms (demo)

---

## Appendix B: Security Notes

- **LoRa:** Transmissions are unencrypted (add AES encryption if needed)
- **Supabase:** RLS policies allow anon insert for gateway
- **API Keys:** Use service role key only for server-side operations
- **Environment:** Never commit `.env` files to Git
- **Rotation:** Rotate API keys regularly
- **Grounding:** Critical for safety and data accuracy

---

## Appendix C: License

**Proprietary - JC APEX Racing Telemetry System**

All rights reserved. Unauthorized reproduction, distribution, or use of this system or any component thereof is strictly prohibited.

---

**Document Version:** 2.1
**Last Updated:** 2026-10-07
**Maintained By:** JC APEX Racing Team
