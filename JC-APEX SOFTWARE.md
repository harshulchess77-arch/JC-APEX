# JC-APEX SOFTWARE - MASTER DOCUMENTATION

**Complete Documentation for JC-APEX Telemetry System**

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete Setup Guide](#2-complete-setup-guide)
3. [Data Pipeline Alignment](#3-data-pipeline-alignment)
4. [Production Deployment](#4-production-deployment)
5. [Migration Report](#5-migration-report)
6. [Recent Bug Fixes](#6-recent-bug-fixes)
7. [Quick Start Guide](#7-quick-start-guide)

---

# 1. PROJECT OVERVIEW

## JC APEX Telemetry System

End-to-end real-time hardware telemetry pipeline using dual Heltec V3 ESP32 SX1262 LoRa modules, WCS1600 current sensor, Python local bridge gateway (with offline-first field capability), Supabase Realtime, and a Vercel-hosted web application with auto-export PDF report generation.

### Repository Structure

```
/
├── firmware/
│   ├── transmitter/
│   │   └── transmitter.ino          # Heltec V3 ESP32 TX + WCS1600 Sensor Logic
│   └── receiver/
│       └── receiver.ino             # Heltec V3 ESP32 RX + USB Serial Gateway Logic
├── gateway/
│   ├── bridge_offline.py            # Field Test Serial-to-CSV Logger
│   ├── bridge_online.py             # Live Serial-to-Supabase Bridge
│   ├── run_bridge.py                # Auto-restart runner for production
│   ├── sync_offline_data.py         # Post-Field CSV-to-Supabase Sync Script
│   └── requirements.txt             # Python dependencies (pyserial, requests)
├── database/
│   └── enable_realtime.sql          # Supabase Realtime enablement
├── web/                             # React/Vite Application Root
│   ├── src/
│   │   ├── pages/                   # Routes & UI views
│   │   ├── hooks/
│   │   │   ├── useTelemetry.js      # Supabase Realtime data hook
│   │   │   └── useRealtimeTelemetry.js
│   │   └── lib/
│   │       └── supabaseClient.js    # Unified Supabase client initialization
│   ├── package.json                 # Web app dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── vercel.json                  # Vercel deployment configuration
│   └── .env.example                 # Sample environment variables
└── JC-APEX SOFTWARE.md              # This master document
```

### Hardware Wiring

#### WCS1600 Sensor to ESP32 Transmitter

**Sensor Specifications:**
- Supply Voltage: 5.0 V
- Sensitivity: 66 mV/A (0.066 V/A)
- Zero-current output: 2.5 V at 5V supply
- Operating Range: ±75 A

**Voltage Divider Circuit:**
- R1 = 10 kΩ (line series resistor)
- R2 = 18 kΩ (pull-down to GND)
- Voltage division factor: K = R2 / (R1 + R2) = 18/28 ≈ 0.64286
- Scaled max output: 5.0 V × 0.64286 = 3.214 V (≤ 3.3 V safe for ESP32 ADC)
- Scaled zero-current baseline: 2.5 V × 0.64286 = 1.607 V

**Wiring Diagram:**
```
WCS1600 Sensor
├── VCC  ──► 5V (USB power bank)
├── GND  ──► GND
└── VOUT ──► R1 (10kΩ) ──► GPIO 1 (ADC1_CH0)
                │
                └─► R2 (18kΩ) ──► GND
```

**Current Calculation Formula:**
```
V_ADC = ADC_Value × (3.3 V / 4095)
I = |(V_ADC - 1.60714) / 0.04243|
```

Where:
- ADC_Value: 12-bit ADC reading (0-4095)
- V_ADC: Voltage at ADC pin (0-3.3 V)
- 1.60714 V: Scaled zero-current baseline
- 0.04243 V/A: Combined sensitivity (0.066 × 0.64286)

### ESP32 Transmitter Setup

**Hardware:**
- Heltec V3 ESP32 SX1262 LoRa Module
- WCS1600 Hall Effect Current Sensor
- USB power bank (5V, 2A minimum)

**Configuration:**
- Frequency: 915.0 MHz
- Bandwidth: 125 kHz
- Spreading Factor: 7
- Coding Rate: 5
- TX Power: 22 dBm
- Sample Rate: 5 Hz (200ms intervals)
- Moving Average: 50-sample window

### ESP32 Receiver Setup

**Hardware:**
- Heltec V3 ESP32 SX1262 LoRa Module
- USB connection to laptop

**Configuration:**
- Frequency: 915.0 MHz (matching transmitter)
- Serial Baud: 115200
- Output: JSON with RSSI/SNR metrics

### Operation Modes

#### Online Mode (Live Streaming)

**Setup:**
1. Power transmitter with USB power bank
2. Connect receiver to laptop via USB
3. Ensure laptop has internet connection
4. Run online bridge:

```bash
python gateway/bridge_online.py --port COM3  # Windows
python gateway/bridge_online.py --port /dev/ttyUSB0  # Linux/Mac
python gateway/bridge_online.py  # Auto-detect
```

**Flow:**
```
[WCS1600] → [ESP32 TX] → (915MHz LoRa) → [ESP32 RX] → (USB) → [Laptop] → [Supabase] → [Web Dashboard]
```

#### Offline Mode (Field Testing)

**Setup:**
1. Power transmitter with USB power bank
2. Connect receiver to laptop via USB
3. No internet required
4. Run offline bridge:

```bash
python gateway/bridge_offline.py --port COM3
```

**Flow:**
```
[WCS1600] → [ESP32 TX] → (915MHz LoRa) → [ESP32 RX] → (USB) → [Laptop CSV Logger]
```

**Output:**
- Creates timestamped CSV file: `session_YYYYMMDD_HHMMSS.csv`
- Columns: session_id, packet_id, current, rssi, snr, timestamp

#### Post-Field Data Sync

**When internet is restored:**

```bash
python gateway/sync_offline_data.py --file session_20261004_150000.csv
```

**Process:**
1. Reads CSV file
2. Validates data
3. Bulk inserts to Supabase (100 records per batch)
4. Reports sync status

### Frontend Integration

#### Realtime Hook Usage

```javascript
import { useTelemetry } from '@/hooks/useTelemetry';

function Dashboard() {
  // Without session filter (receives all sessions)
  const { hardwareData, isConnected, sessionId } = useTelemetry();

  // With session filter (receives only specific session)
  const { hardwareData, isConnected } = useTelemetry('20261004_150000');

  // hardwareData contains:
  // - current: Amperes
  // - rssi: dBm
  // - snr: dB
  // - packetId: Integer
  // - timestamp: ISO string
  // - sessionId: String
}
```

#### Mock Telemetry Hook

For testing without hardware:

```javascript
import { useTelemetry } from '@/hooks/useMockTelemetry';

function Dashboard() {
  const { telemetry, chartData, formatTime } = useTelemetry();
  // Returns simulated telemetry data
}
```

#### PDF Export

**Endpoint:** `/api/export-pdf?sessionId=xyz` (in web/ directory)

**Frontend Example:**
```javascript
const exportPdf = async (sessionId) => {
  const response = await fetch(`/api/export-pdf?sessionId=${sessionId}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session_report_${sessionId}.pdf`;
  a.click();
};
```

#### Running the Web Application

```bash
cd web
npm run dev    # Development server
npm run build  # Production build
npm run preview # Preview production build
```

### Performance Specifications

- **Transmission Rate:** 5 Hz (200ms intervals)
- **Moving Average:** 50-sample window
- **Database Indexing:** Optimized on session_id and created_at
- **Realtime Latency:** Sub-second updates via postgres_changes
- **Current Range:** ±75 A (WCS1600 spec)
- **ADC Resolution:** 12-bit (0-4095)
- **LoRa Range:** Up to 15 km (line of sight, SF7)

### Security Notes

- LoRa transmissions are unencrypted (add encryption if needed)
- Supabase RLS policies allow anon insert for gateway
- Use service role key only for server-side operations
- Never commit `.env` files to Git
- Rotate API keys regularly

---

# 2. COMPLETE SETUP GUIDE

## 🏎️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELECTROTHON 48V VEHICLE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│  │ 48V Battery  │───▶│  Hall Effect  │───▶│  WCS1600     │         │
│  │    (820k/47k)  │    │   Speed       │    │  Current      │         │
│  └──────────────┘    └──────────────┘    └──────────────┘         │
│        │                   │                   │                   │
│        ▼                   ▼                   ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              HELTEC V3 TX (ESP32-S3 + SX1262 LoRa)          │  │
│  │  • ADC Reads: GPIO 19 (Voltage), GPIO 1 (Current)          │  │
│  │  • Hall Interrupt: GPIO 7                                      │  │
│  │  • GPS UART: Serial1 (RX: 17, TX: 15)                      │  │
│  │  • EMA Filter: ALPHA = 0.15                                   │  │
│  │  • Auto-Calibration: 50 samples @ 500ms boot                 │  │
│  │  • Deadband: Voltage < 2.0V → 0V, Current < 0.3A → 0A       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼ (915 MHz LoRa)              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              HELTEC V3 RX (ESP32-S3 + SX1262 LoRa)          │  │
│  │  • Receives packets via DIO1 interrupt                       │  │
│  │  • Outputs JSON via USB (CP2102) @ 115200 baud              │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼ USB Serial                  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              PYTHON BRIDGE (PC/Gateway)                       │  │
│  │  • bridge_online.py reads serial stream                     │  │
│  │  • Parses JSON and pushes to Supabase via REST API            │  │
│  │  • Logs to CSV backup (session_*.csv)                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼ HTTPS                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              SUPABASE CLOUD DATABASE                         │  │
│  │  • telemetry_logs table (INSERT events)                     │  │
│  │  • Realtime publication enabled                               │  │
│  │  • Row Level Security (RLS) policies                         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼ WebSocket                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              REACT DASHBOARD (Vercel)                         │  │
│  │  • useTelemetry hook subscribes to INSERT events              │  │
│  │  • Live gauges: Voltage, Current, Power, Speed                │  │
│  │  • Race Ops: Lap timer, flag control, incident log            │  │
│  │  • Driver HUD: Command acknowledgment, flag display            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites & Drivers

### 1. Node.js (Frontend)
```bash
# Install latest LTS version (18.x or 20.x)
# Download from: https://nodejs.org/
# Verify installation:
node --version
npm --version
```

### 2. Python 3.10+ (Gateway)
```bash
# Install Python 3.10 or later
# Download from: https://www.python.org/
# Verify installation:
python --version
# or
python3 --version
```

### 3. Arduino IDE (Microcontroller Firmware)
1. Download Arduino IDE 2.x from https://www.arduino.cc/en/software
2. Configure Board Manager:
   - File → Preferences → Additional Boards Manager URLs
   - Add: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. Install Board:
   - Tools → Board → Boards Manager
   - Search: "esp32"
   - Install: "esp32 by Espressif Systems" (v2.0.11+)
4. Select Board:
   - Tools → Board → "Heltec WiFi LoRa 32(V3) / Wireless shell(V3)"

### 4. Silicon Labs CP210x Drivers (USB Communication)
- Download from: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- Install "CP210x Universal Windows Driver"
- Plug in Heltec V3, verify Device Manager shows "CP210x USB to UART Bridge" under Ports (COMx on Windows)

### 5. Required Arduino Libraries
Install via Tools → Manage Libraries:
- **RadioLib** (by Jan Gromes) - LoRa SX1262 driver
- **TinyGPSPlus** (by Mikal Hart) - GPS NMEA parser
- **ArduinoJson** (by Benoit Blanchon) - JSON serialization
- **Adafruit SSD1306** (by Adafruit) - OLED display
- **Adafruit GFX** (by Adafruit) - Graphics library

## 🔧 Microcontroller Firmware

### Transmitter (TX) - `firmware/transmitter/transmitter.ino`

The transmitter firmware includes:
- **EMA Filtering:** `ALPHA = 0.15` for noise reduction
- **Auto-Calibration:** 50 samples over 500ms for WCS1600 zero-current baseline
- **Deadband Logic:** Voltage < 2.0V → 0V, Current < 0.3A → 0A
- **Hardware Wiring:**
  - GPIO 19: 48V Battery (820kΩ/47kΩ divider)
  - GPIO 1: WCS1600 Current Sensor
  - GPIO 7: Hall Effect Speed Sensor (INPUT_PULLUP)
  - GPIO 17/15: GPS UART (RX/TX)

**Upload Instructions:**
1. Open `firmware/transmitter/transmitter.ino` in Arduino IDE
2. Select "Heltec WiFi LoRa 32(V3) / Wireless shell(V3)" board
3. Select correct COM port (CP210x device)
4. Click Upload button

### Receiver (RX) - `firmware/receiver/receiver.ino`

The receiver firmware:
- Listens for LoRa packets via DIO1 interrupt
- Parses CSV payload and appends RSSI/SNR
- Outputs strict JSON via USB Serial (115200 baud)
- No boot messages (silent mode for Python bridge)

**Upload Instructions:**
1. Open `firmware/receiver/receiver.ino` in Arduino IDE
2. Select "Heltec WiFi LoRa 32(V3) / Wireless shell(V3)" board
3. Select correct COM port (different device from TX)
4. Click Upload button

## ⚠️ Hardware & Safety Rules

### CRITICAL: Grounding Requirements
**WARNING:** Improper grounding can cause floating ADC readings, erratic sensor data, or equipment damage.

**✅ REQUIRED GROUNDING:**
1. **Common Ground Reference:** Connect ESP32 GND pin to the 48V battery negative terminal
2. **Star Grounding:** Connect all sensor grounds to a single point, then to battery negative
3. **No Floating ADCs:** Never leave ADC pins floating - use pull-down resistors if needed

**❌ PROHIBITED:**
- Do NOT connect ESP32 GND to battery positive (48V) - will destroy ESP32
- Do NOT power sensors from separate sources without common ground
- Do NOT use ungrounded oscilloscopes for debugging

### Wiring Checklist
- [ ] 48V Battery Negative → ESP32 GND
- [ ] Current Sensor GND → ESP32 GND
- [ ] Hall Sensor GND → ESP32 GND
- [ ] GPS GND → ESP32 GND
- [ ] Heltec V3 USB GND (via CP2102) connected to PC GND

## 🗄️ Database Schema (Supabase SQL)

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================================================
-- JC-APEX TELEMETRY SYSTEM - SUPABASE DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: TELEMETRY_LOGS (Main sensor data table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  packet_id BIGINT NOT NULL,
  current NUMERIC(10, 2) NOT NULL,
  voltage NUMERIC(10, 2) NOT NULL,
  power NUMERIC(10, 2) NOT NULL,
  speed_hall NUMERIC(10, 2) NOT NULL,
  speed_gps NUMERIC(10, 2) NOT NULL,
  latitude NUMERIC(11, 6) DEFAULT 0,
  longitude NUMERIC(11, 6) DEFAULT 0,
  rssi INTEGER NOT NULL,
  snr NUMERIC(5, 1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_session_id ON telemetry_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_created_at ON telemetry_logs(created_at DESC);

-- ============================================================================
-- TABLE 2: COMMANDS (Pit-to-Driver command history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS commands (
  id BIGSERIAL PRIMARY KEY,
  command_id TEXT NOT NULL UNIQUE,
  sender TEXT NOT NULL, -- 'PIT' or 'DIRECTOR'
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL, -- 'SENT', 'DELIVERED', 'ACKNOWLEDGED', 'EXPIRED'
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commands_session_id ON commands(session_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);

-- ============================================================================
-- TABLE 3: RACE_FLAGS (Race control flag state)
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_flags (
  id BIGSERIAL PRIMARY KEY,
  flag TEXT NOT NULL, -- 'green', 'yellow', 'red', 'black'
  set_by TEXT NOT NULL, -- 'PIT' or 'DIRECTOR'
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_race_flags_session_id ON race_flags(session_id);

-- ============================================================================
-- ENABLE REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE commands;
ALTER PUBLICATION supabase_realtime ADD TABLE race_flags;

-- Verify publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_flags ENABLE ROW LEVEL SECURITY;

-- Allow anonymous operations (for Python bridge and frontend)
CREATE POLICY "Allow anonymous insert telemetry" ON telemetry_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select telemetry" ON telemetry_logs
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert commands" ON commands
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select commands" ON commands
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert flags" ON race_flags
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select flags" ON race_flags
  FOR SELECT TO anon USING (true);
```

## 🐍 Python Gateway Setup

### 1. Create Virtual Environment
```bash
cd gateway
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create `.env` file in `gateway/` directory:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Run Bridge Script
```bash
# Direct run (for testing)
python bridge_online.py --port COM7  # Windows
python bridge_online.py --port /dev/ttyUSB0  # Linux/macOS

# Auto-restart runner (for production)
python run_bridge.py
```

### 5. Verify Connection
Bridge console should show:
```
[SERIAL] Auto-selected candidate port: COM7
[SERIAL OK] Connected to COM7 at 115200 baud.
[SESSION ID] SES_20261006_023431
========================================================
  JC-APEX BRIDGE ONLINE - LISTENING FOR 48V LORA DATA   
========================================================
[HH:MM:SS] PKT #1 | 49.8V | 45.20A | 2250.9W -> [LIVE]
```

## 🌐 Frontend Dashboard & Vercel Setup

### 1. Install Frontend Dependencies
```bash
cd web
npm install
```

### 2. Configure Environment Variables
Create `.env` file in `web/` directory:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Vite Configuration
`web/vite.config.js` should include:
```javascript
export default defineConfig({
  base: '/',  // Important for SPA routing
  server: {
    historyApiFallback: true  // Dev server SPA support
  }
});
```

### 4. Vercel SPA Routing Fix
The `web/vercel.json` is configured for SPA routing:
```json
{
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/favicon.ico", "destination": "/favicon.ico" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Important:** Ensure your Vercel project has "Root Directory" set to `web/` in project settings.

### 5. useTelemetry Hook Usage
```javascript
import { useTelemetry } from '../hooks/useTelemetry';

function TelemetryDashboard() {
  const { telemetry, chartData, power, signalLost } = useTelemetry(
    null,      // sessionId (null = all sessions)
    true,      // enabled
    { isDemoMode: false }  // Set to true for demo mode
  );
  
  // telemetry.current, telemetry.voltage, telemetry.power, etc.
  // Automatically updates via Supabase Realtime
}
```

### 6. Build & Deploy
```bash
cd web
npm run build
```

Deploy to Vercel (if not already configured):
```bash
vercel
```

## 🏁 Trackside Pre-Flight Checklist (5 Minutes)

**POWER ON SEQUENCE:**
- [ ] Heltec V3 TX powered on (vehicle side)
- [ ] Heltec V3 RX powered on (pit side, connected to PC)
- [ ] 48V battery connected with proper grounding
- [ ] CP210x USB drivers installed on PC

**VERIFICATION:**
- [ ] Arduino IDE can see both Heltec V3 devices in ports list
- [ ] TX firmware uploaded successfully (verify via OLED)
- [ ] RX firmware uploaded successfully (verify via OLED)
- [ ] Python bridge connects to RX COM port without PermissionError
- [ ] Bridge console shows "PKT #1" with real voltage/current data
- [ ] Supabase Realtime SQL executed successfully
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Vercel deployment shows no errors

**FINAL TEST:**
- [ ] Open https://jc-apex.vercel.app/telemetry-dashboard
- [ ] Login with `PEGATSA@55` (Pit Engineer)
- [ ] Dashboard shows live data updating
- [ ] Test sub-route refresh: navigate to `/pit`, refresh page
- [ ] Test command dispatch from Race Ops tab
- [ ] Test flag change and verify driver HUD display

## 🔧 Master Troubleshooting Guide

### 1. PermissionError(13) COM Port Lock
**Symptom:** `could not open port 'COM7': PermissionError(13, 'Access is denied.')`

**Fixes:**
- Close Arduino IDE Serial Monitor if open
- Close any other serial terminal applications (PuTTY, TeraTerm)
- Unplug and replug USB cable
- On Windows: Run Device Manager → Ports → Uninstall CP210x → Replug
- On Linux/macOS: `sudo chmod 666 /dev/ttyUSB0`
- On Windows: Restart Arduino IDE with elevated permissions

### 2. Floating/Erratic Sensor Noise
**Symptom:** Voltage/current readings jump between 0-5V randomly when vehicle idle

**Fixes:**
- **Check grounding:** Verify ESP32 GND connected to battery negative
- **Increase deadband:** Modify `VOLTAGE_DEADBAND_THRESHOLD` to 3.0V
- **Reduce EMA alpha:** Lower `EMA_ALPHA` to 0.10 for more smoothing
- **Recalibrate:** Power cycle transmitter to run auto-calibration again
- **Check solder joints:** Verify resistor divider connections are solid

### 3. Vercel 404 Refresh Error on Sub-Routes
**Symptom:** Refreshing `/pit` or `/telemetry-dashboard` shows 404 NOT_FOUND

**Fixes:**
- Verify root `vercel.json` has `outputDirectory: "web/dist"`
- Verify rewrite rule: `{"source": "/(.*)", "destination": "/index.html"}`
- Check Vercel project Settings → General → Root Directory
  - If empty: current config is correct
  - If set to `web/`: move `vercel.json` to `web/` and change `outputDirectory` to `"dist"`
- Redeploy after changes

### 4. Database Sync Key Mismatch
**Symptom:** Frontend shows no data despite bridge inserting successfully

**Fixes:**
- Verify `.env` file in `web/` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase SQL Editor → telemetry_logs table → verify data is being inserted
- Check browser console for WebSocket connection errors
- Verify Realtime publication is enabled: `ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_logs;`
- Check RLS policies allow anonymous SELECT

### 5. Pit-Side Acknowledgment Crash
**Symptom:** Pit dashboard crashes when driver acknowledges command

**Fixes:**
- Check `useRealtimeTelemetry.js` has try-catch blocks in `sendCommand()` and `sendAck()`
- Verify `handleDriverAck()` has null check: `if (!ackData || !ackData.commandId) return;`
- Check browser console for JavaScript errors
- Ensure command ID is properly passed through payload structure

### 6. No GPS Data Showing
**Symptom:** GPS speed always shows 0.0 mph

**Fixes:**
- Verify GPS module powered (3.3V or 5V, check datasheet)
- Check GPS TX connected to ESP32 GPIO 15, RX to GPIO 17
- Verify baud rate: `Serial1.begin(9600, SERIAL_8N1, 17, 15)`
- Check GPS antenna is connected and has clear sky view
- Wait 30-60 seconds for GPS to acquire satellite lock

### 7. LoRa Connection Failure
**Symptom:** TX console shows "TX FAILED" or RX shows no packets

**Fixes:**
- Verify both TX and RX use same frequency: 915.0 MHz
- Check sync word matches: `LORA_SYNC_WORD = 0x12`
- Verify antennas are connected to LoRa headers
- Check distance between TX and RX (range: up to 2km in open area)
- Verify TX power: `LORA_TX_POWER = 22` (max for SX1262)

## 📱 Login Credentials

- **Demo Mode:** `DEMO@55` (simulated data, no hardware needed)
- **Pit Engineer:** `PEGATSA@55` (live hardware mode)
- **Driver:** `DGATSA@55` (live hardware mode)
- **Race Director:** `RDGATSA@55` (live hardware mode)

---

# 3. DATA PIPELINE ALIGNMENT

## ✅ CURRENT STATUS: ALIGNED AND WORKING

Your pipeline is already correctly aligned! Here's the exact key mapping across all three components:

## 1. PYTHON BRIDGE PAYLOAD (`gateway/bridge_online.py`)

**Lines 223-236:**
```python
db_payload = {
    "session_id": self.session_id,
    "packet_id": packet_id,
    "current": round(current_amps, 2),
    "voltage": round(voltage_volts, 2),
    "power": round(power_watts, 2),
    "speed_hall": round(speed_hall, 2),
    "speed_gps": round(speed_gps, 2),
    "latitude": round(lat, 6),
    "longitude": round(lng, 6),
    "rssi": rssi,
    "snr": round(snr, 1),
    "created_at": iso_time
}
```

**Keys sent to Supabase:**
- `session_id` (TEXT)
- `packet_id` (BIGINT)
- `current` (NUMERIC) ← ← ←
- `voltage` (NUMERIC) ← ← ←
- `power` (NUMERIC) ← ← ←
- `speed_hall` (NUMERIC) ← ← ←
- `speed_gps` (NUMERIC) ← ← ←
- `latitude` (NUMERIC)
- `longitude` (NUMERIC)
- `rssi` (INTEGER)
- `snr` (NUMERIC)
- `created_at` (TIMESTAMPTZ)

## 2. SUPABASE TABLE SCHEMA (`telemetry_logs`)

**Column names (must match Python bridge):**
- `session_id` ← Python: `session_id` ✅
- `packet_id` ← Python: `packet_id` ✅
- `current` ← Python: `current` ✅
- `voltage` ← Python: `voltage` ✅
- `power` ← Python: `power` ✅
- `speed_hall` ← Python: `speed_hall` ✅
- `speed_gps` ← Python: `speed_gps` ✅
- `latitude` ← Python: `latitude` ✅
- `longitude` ← Python: `longitude` ✅
- `rssi` ← Python: `rssi` ✅
- `snr` ← Python: `snr` ✅
- `created_at` ← Python: `created_at` ✅

## 3. FRONTEND PAYLOAD MAPPER (`web/src/hooks/useTelemetry.js`)

**Frontend reads these keys from `payload.new`:**
- `data.current` ← Supabase: `current` ← Python: `current` ✅
- `data.voltage` ← Supabase: `voltage` ← Python: `voltage` ✅
- `data.power` ← Supabase: `power` ← Python: `power` ✅
- `data.speed_hall` ← Supabase: `speed_hall` ← Python: `speed_hall` ✅
- `data.speed_gps` ← Supabase: `speed_gps` ← Python: `speed_gps` ✅
- `data.latitude` ← Supabase: `latitude` ← Python: `latitude` ✅
- `data.longitude` ← Supabase: `longitude` ← Python: `longitude` ✅
- `data.rssi` ← Supabase: `rssi` ← Python: `rssi` ✅
- `data.snr` ← Supabase: `snr` ← Python: `snr` ✅
- `data.packet_id` ← Supabase: `packet_id` ← Python: `packet_id` ✅
- `data.session_id` ← Supabase: `session_id` ← Python: `session_id` ✅

## 🎯 END-TO-END DATA FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. RECEIVER FIRMWARE (C++)                                      │
│    JSON: {"id": 105, "amps": 45.2, "volts": 49.8, ...}         │
└────────────────────────┬────────────────────────────────────────┘
                         │ USB Serial (115200 baud)
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PYTHON BRIDGE (bridge_online.py)                             │
│    Reads JSON, maps to db_payload:                              │
│    "amps" → "current"                                           │
│    "volts" → "voltage"                                          │
│    "watts" → "power"                                            │
│    Pushes to Supabase REST API                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SUPABASE (telemetry_logs table)                              │
│    Columns: current, voltage, power, speed_hall, speed_gps, ... │
│    Realtime publishes INSERT events                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket (postgres_changes)
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND (useTelemetry.js)                                   │
│    Subscribes to INSERT events                                  │
│    Reads payload.new.current, .voltage, .power, ...             │
│    Updates React state → UI gauges render live                   │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ VERIFICATION CHECKLIST

### ✅ Python Bridge → Supabase
- [x] `current` (Python) → `current` (Supabase column)
- [x] `voltage` (Python) → `voltage` (Supabase column)
- [x] `power` (Python) → `power` (Supabase column)
- [x] `speed_hall` (Python) → `speed_hall` (Supabase column)
- [x] `speed_gps` (Python) → `speed_gps` (Supabase column)
- [x] `rssi` (Python) → `rssi` (Supabase column)
- [x] `snr` (Python) → `snr` (Supabase column)

### ✅ Supabase → Frontend
- [x] `current` (Supabase) → `data.current` (Frontend)
- [x] `voltage` (Supabase) → `data.voltage` (Frontend)
- [x] `power` (Supabase) → `data.power` (Frontend)
- [x] `speed_hall` (Supabase) → `data.speed_hall` (Frontend)
- [x] `speed_gps` (Supabase) → `data.speed_gps` (Frontend)
- [x] `rssi` (Supabase) → `data.rssi` (Frontend)
- [x] `snr` (Supabase) → `data.snr` (Frontend)

## 🚀 YOUR PIPELINE IS READY FOR LIVE DEMO!

All keys are perfectly aligned. When you:
1. Power on your Heltec V3 hardware
2. Run `python bridge_online.py`
3. Login to the dashboard with `PEGATSA@55`

The gauges will update with your real vehicle data in real-time! 🏁

---

# 4. PRODUCTION DEPLOYMENT

## Prerequisites

- GitHub account with repository access: `harshulchess77-arch/JC-APEX`
- Supabase account (free tier is sufficient)
- Vercel account (free tier is sufficient)
- Local Git installation

## SECTION A: SUPABASE CLOUD SETUP (5 Minutes)

### Step 1: Create Supabase Project

1. Navigate to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Configure project:
   - **Name:** `JC-APEX-DB`
   - **Database Password:** Generate a strong password (save it securely)
   - **Region:** Choose region closest to your physical location
   - **Pricing Plan:** Free (recommended for testing)
4. Click **"Create new project"**
5. Wait 1-2 minutes for project initialization

### Step 2: Execute Database Schema

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Copy the entire contents of the database schema from Section 2
4. Paste into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Verify success message: "Success. No rows returned"

**What this does:**
- Creates `telemetry_logs` table with proper schema
- Creates indexes for fast queries
- Enables Row Level Security (RLS)
- Sets up public read/insert policies
- Enables Supabase Realtime for live telemetry

### Step 3: Copy Supabase Credentials

1. In Supabase dashboard, click **Project Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy the following values (save them temporarily):

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon / public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role key (SECRET):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **Important:** The service_role key has full admin access. Never commit it to Git or expose it to clients.

### Step 4: Verify Realtime is Enabled

1. In Supabase dashboard, click **Database** in the left sidebar
2. Click **Replication** in the sidebar
3. Verify `telemetry_logs` table is listed under `supabase_realtime` publication
4. If not, run this in SQL Editor:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_logs;
   ```

## SECTION B: VERCEL HOSTING DEPLOYMENT (3 Minutes)

### Step 1: Import Repository to Vercel

1. Navigate to [https://vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import"** next to your GitHub repository: `harshulchess77-arch/JC-APEX`
4. If prompted, install Vercel GitHub integration (authorize access)

### Step 2: Configure Root Directory

1. In Vercel project configuration, find **"Root Directory"**
2. Set it to: `web`
3. This ensures Vercel builds the web app, not the entire repository

### Step 3: Configure Environment Variables

1. Scroll to **"Environment Variables"** section
2. Add the following variables with values from Supabase:

   **Variable 1:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase Project URL
   - **Environment:** All (Production, Preview, Development)

   **Variable 2:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Your Supabase anon/public key
   - **Environment:** All (Production, Preview, Development)

   **Variable 3:**
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your Supabase service_role key
   - **Environment:** Production only (NOT for Preview/Development)
   - ⚠️ This key is used by server-side API routes for PDF generation

3. Click **"Add"** for each variable

### Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (typically 30-60 seconds)
3. Verify deployment succeeds with green checkmark
4. Copy the deployment URL (e.g., `https://jc-apex-telemetry.vercel.app`)

### Step 5: Verify Deployment

1. Click the deployment URL to open the live site
2. Verify the application loads without errors
3. Check browser console for any Supabase connection errors

## SECTION C: GATEWAY CONFIGURATION (Local Setup)

### Step 1: Configure Gateway Environment

1. Navigate to the `gateway/` directory locally
2. Copy `.env.example` to `.env`:
   ```bash
   cd gateway
   cp .env.example .env
   ```

3. Edit `.env` with your Supabase credentials:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 2: Install Python Dependencies

```bash
cd gateway
pip install pyserial python-dotenv requests
```

### Step 3: Test Gateway Scripts

**Test offline bridge (without hardware):**
```bash
# Terminal 1: Start mock simulator
python mock_simulator.py

# Terminal 2: Start bridge (will auto-detect if no --port specified)
python bridge_offline.py
```

**Test data sync to Supabase:**
```bash
# First, generate some offline data with mock simulator + bridge
# Then sync to Supabase:
python sync_offline_data.py --file session_YYYYMMDD_HHMMSS.csv
```

## SECTION D: PRE-HARDWARE DRY RUN TEST

### Step 1: Test Real-time Telemetry Flow

1. **Start the mock simulator:**
   ```bash
   cd gateway
   python mock_simulator.py
   ```

2. **Start the offline bridge in a separate terminal:**
   ```bash
   cd gateway
   python bridge_offline.py
   ```

3. **Verify CSV logging:**
   - Check that `session_YYYYMMDD_HHMMSS.csv` is created
   - Open the CSV file to verify data format

4. **Sync to Supabase:**
   ```bash
   python sync_offline_data.py --file session_YYYYMMDD_HHMMSS.csv
   ```

5. **Verify in Supabase Dashboard:**
   - Go to Supabase → Table Editor → `telemetry_logs`
   - Verify data appears in the table
   - Check that `session_id`, `packet_id`, `current`, `rssi`, `snr` are populated

### Step 2: Test Web App Real-time Connection

1. Open your deployed Vercel URL in a browser
2. Navigate to the telemetry dashboard page
3. With mock simulator running and bridge logging to Supabase, verify:
   - Real-time data appears in the web interface
   - Charts update with live telemetry
   - No console errors related to Supabase

### Step 3: Test PDF Export

1. In Supabase Dashboard, note a `session_id` from the telemetry_logs table
2. In the web app, trigger PDF export for that session
3. Verify PDF downloads with:
   - Session metadata header
   - Summary statistics (peak current, average current, duration)
   - Telemetry data table

## SECTION E: HARDWARE DEPLOYMENT

### Step 1: Flash Firmware to ESP32 Devices

**Transmitter (Heltec V3):**
1. Open Arduino IDE
2. Load `firmware/transmitter/transmitter.ino`
3. Select board: "Heltec WiFi LoRa 32 V3"
4. Select correct COM port
5. Upload firmware
6. Verify OLED displays "TX Node Init..." then live telemetry

**Receiver (Heltec V3):**
1. Load `firmware/receiver/receiver.ino`
2. Select board: "Heltec WiFi LoRa 32 V3"
3. Select correct COM port
4. Upload firmware
5. Verify OLED displays "RX Node Init..." then live packet stats

### Step 2: Connect Hardware to Gateway

1. Connect Receiver ESP32 via USB to your computer
2. Identify COM port (e.g., COM3 on Windows, /dev/ttyUSB0 on Linux)
3. Run offline bridge:
   ```bash
   cd gateway
   python bridge_offline.py --port COM3  # Windows
   # or
   python bridge_offline.py --port /dev/ttyUSB0  # Linux
   ```

4. Verify:
   - Serial connection established
   - Packets received and logged to CSV
   - OLED on Receiver shows live RSSI/SNR

### Step 3: Sync to Cloud

1. After field test, sync CSV to Supabase:
   ```bash
   python sync_offline_data.py --file session_YYYYMMDD_HHMMSS.csv
   ```

2. Verify data appears in Supabase Dashboard

3. Access data via web app at your Vercel URL

## TROUBLESHOOTING

### Supabase Issues

**Realtime not working:**
- Verify `telemetry_logs` is in `supabase_realtime` publication
- Check RLS policies allow anon read/insert
- Verify anon key is correct in Vercel environment variables

**Connection refused:**
- Verify Project URL is correct (https://, not http://)
- Check that anon key matches Supabase Dashboard
- Verify Supabase project is not paused

### Vercel Issues

**Build fails:**
- Verify Root Directory is set to `web`
- Check that `package.json` scripts are correct
- Verify all dependencies are installed (`npm install`)

**Environment variables not working:**
- Verify variable names match exactly (case-sensitive)
- Ensure `VITE_` prefix is used for client-side variables
- Check that variables are set for correct environments

### Gateway Issues

**Serial port not found:**
- Verify ESP32 is connected via USB
- Check device manager (Windows) or `ls /dev/tty*` (Linux)
- Try auto-detection: `python bridge_offline.py` (no --port flag)

**Sync to Supabase fails:**
- Verify `.env` file exists in `gateway/` directory
- Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Verify CSV file format matches expected schema

## SECURITY NOTES

1. **Never commit secrets to Git:**
   - `.env` files are in `.gitignore`
   - Service role key should only be in server-side environment
   - Use anon/public key for client-side access

2. **Row Level Security (RLS):**
   - Database has RLS enabled with appropriate policies
   - Anon users can read and insert telemetry data
   - Authenticated users have full CRUD access

3. **API Key Rotation:**
   - Consider rotating service role key periodically
   - Update Vercel environment variables after rotation
   - Update local `.env` files after rotation

## PRODUCTION CHECKLIST

Before going to production:

- [ ] Supabase project created and schema deployed
- [ ] Supabase credentials copied and saved securely
- [ ] Vercel project imported with root directory set to `web`
- [ ] Vercel environment variables configured (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Vercel deployment successful and verified
- [ ] Gateway `.env` configured with Supabase credentials
- [ ] Mock simulator tested with bridge_offline.py
- [ ] Data sync to Supabase verified
- [ ] Web app real-time connection tested
- [ ] PDF export functionality tested
- [ ] Firmware flashed to ESP32 devices
- [ ] Hardware connection and data logging verified
- [ ] End-to-end field test completed

---

# 5. MIGRATION REPORT

## Executive Summary

Successfully migrated the JC APEX telemetry application from Base44 proprietary dependencies to a fully self-hosted stack using React + Vite + Supabase (Database & Auth) + Vercel (Production Web Hosting). The application now supports both offline USB/LoRa WebSocket bridge for track day telemetry and online cloud-based historical data access.

## Files Modified

### Configuration Files
1. **package.json**
   - Removed: `@base44/sdk` (^0.8.40), `@base44/vite-plugin` (^1.0.30)
   - Added: `@supabase/supabase-js` (^2.39.0), `socket.io-client` (^4.6.0)

2. **vite.config.js**
   - Removed: Base44 Vite plugin configuration
   - Added: Path alias resolution for `@/*` imports

3. **jsconfig.json**
   - Updated include/exclude patterns for proper TypeScript resolution

### Source Files Created
4. **src/lib/supabaseClient.js** - Centralized Supabase client configuration
5. **src/vite-env.d.ts** - TypeScript declarations for Vite environment variables
6. **supabase/schema.sql** - Complete database schema with RLS policies
7. **vercel.json** - Vercel deployment configuration for SPA routing
8. **.env.example** - Environment variable documentation

### Source Files Modified
9. **src/lib/AuthContext.jsx**
   - Replaced Base44 authentication with Supabase Auth
   - Implemented session management and auth state listeners

10. **src/pages/DriverProfile.jsx**
    - Replaced `base44.entities.Driver` calls with Supabase queries
    - Updated CRUD operations for driver data

11. **src/pages/VechileConfig.jsx**
    - Replaced Base44 entity calls with Supabase queries
    - Updated vehicle configuration CRUD operations

12. **src/hooks/useTelemetry.jsx**
    - Added dual-mode telemetry ingestion (WebSocket + Supabase)
    - Implemented fallback to mock data when connections fail
    - Added connection mode tracking

13. **src/App.jsx**
    - Fixed import paths to match actual filenames
    - Updated Toaster import path

14. **src/pages/landings.jsx**
    - Fixed import path for OracleEngine component

15. **src/components/ui/toast.jsx**
    - Removed duplicate imports causing build errors

### Files Removed
16. **src/lib/app-params.js** - Base44-specific parameter handling
17. **src/api/base44Client.js** - Base44 SDK client configuration

## Database Schema

### Tables Created

1. **drivers**
   - Driver profiles with stats, vehicle setup, and notes
   - Fields: name, number, age, weight_kg, experience_years, wins, podiums, races_entered, best_finish, avg_lap_time, notes, motor_type, battery_capacity, gear_ratio, tire_type, wheel_size, aero_config, setup_notes, status

2. **vehicle_configs**
   - Vehicle configuration settings for races
   - Fields: race_name, tire_pressure_front/rear, suspension_front/rear, gear_ratio, motor_controller, camber_front/rear, ride_height, ballast_position, notes, driver_id (foreign key)

3. **races**
   - Race/event information
   - Fields: name, circuit_name, date, total_laps, status

4. **telemetry_logs**
   - Time-series telemetry data
   - Fields: race_id, driver_id, timestamp, speed, battery, temp, voltage, current, efficiency, lap, race_time

5. **incident_reports**
   - Incident tracking and resolution
   - Fields: race_id, driver_id, incident_type, description, severity, timestamp, resolved

### Security
- Row Level Security (RLS) enabled on all tables
- Public read access for all data
- Authenticated write access for create/update/delete operations
- Automatic updated_at timestamps via triggers

## Deployment Instructions

### Step 1: Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Navigate to the SQL Editor in your Supabase dashboard
3. Copy and run the entire contents of `supabase/schema.sql`
4. Verify all tables and RLS policies are created correctly
5. Copy your Supabase URL and anon key from project settings

### Step 2: Local Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create `.env.local` file:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SOCKET_SERVER_URL=http://localhost:4000
   ```
4. Run `npm run dev` to start the development server

### Step 3: Vercel Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to Vercel and click "Add New Project"
3. Import your repository
4. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SOCKET_SERVER_URL` (optional)
6. Click "Deploy"

### Step 4: Offline Telemetry Bridge (Optional)

For local track day telemetry with USB/LoRa support:

1. Ensure your WebSocket bridge server is running on port 4000
2. The app will automatically detect and connect to the local server
3. If unavailable, it will fall back to Supabase historical data or mock data

## Verification Checklist

- ✅ All Base44 dependencies removed from package.json
- ✅ Supabase client created and configured
- ✅ Authentication migrated to Supabase Auth
- ✅ All data models migrated to Supabase tables
- ✅ Driver profile CRUD operations working with Supabase
- ✅ Vehicle config CRUD operations working with Supabase
- ✅ Dual-mode telemetry ingestion implemented
- ✅ Vercel deployment configuration created
- ✅ Environment variables documented
- ✅ Build completes successfully (`npm run build`)
- ✅ All route imports fixed for actual filenames
- ✅ TypeScript declarations added for env variables
- ✅ README updated with migration information

## Architecture Overview

### Frontend Stack
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Routing:** React Router DOM
- **State Management:** React hooks + TanStack Query
- **Icons:** Lucide React

### Backend Stack
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Real-time:** Socket.io (for local WebSocket bridge)

### Deployment
- **Production:** Vercel
- **Development:** Vite dev server
- **Offline Bridge:** Local Node.js WebSocket server

### Data Flow
1. **Live Mode:** USB/LoRa → WebSocket Server → React App (real-time)
2. **Cloud Mode:** Supabase Database → React App (historical)
3. **Fallback Mode:** Mock data generation when no connection available

## Known Issues & Future Enhancements

### Current Limitations
- File naming inconsistencies (VechileConfig.jsx, TelemetryDashbaord.jsx, OrcaleEngine.jsx) - these were preserved to maintain compatibility
- TypeScript errors in UI components due to missing type definitions (cosmetic only, build succeeds)

### Recommended Future Work
1. Rename files with typos to correct spelling
2. Add proper TypeScript types for all components
3. Implement Supabase real-time subscriptions for live cloud updates
4. Add data migration script to export existing Base44 data to Supabase
5. Implement proper error boundaries and loading states
6. Add unit and integration tests

## Conclusion

The migration from Base44 to Supabase + Vercel has been completed successfully. The application is now fully self-hosted with no proprietary dependencies, supports both offline and online telemetry modes, and is ready for production deployment on Vercel.

**Build Status:** ✅ PASSING
**Base44 Dependencies:** ✅ REMOVED
**Supabase Integration:** ✅ COMPLETE
**Vercel Deployment:** ✅ READY

---

# 6. RECENT BUG FIXES

## 1. ✅ Fix SPA Refresh 404 Error
**File:** `web/vite.config.js`
**Change:** Added `historyApiFallback: true` to server config
```javascript
server: {
  port: 3000,
  host: true,
  historyApiFallback: true  // ← Added this
}
```
**Result:** Refreshing any sub-route now works correctly in development and production (via vercel.json)

---

## 2. ✅ Fix Missing Command Name in Driver View
**File:** `web/src/pages/DriverHUD.jsx`
**Change:** Added fallback for command name display
```javascript
{incomingCommands[0].payload || incomingCommands[0].type || 'INCOMING COMMAND'}
```
**Result:** Command notification now always shows text even if payload is missing

---

## 3. ✅ Debug Pit-Side Crash on Driver Acknowledgment
**File:** `web/src/hooks/useRealtimeTelemetry.js`
**Changes:**
- Added null checks and try-catch blocks in `sendCommand()`
- Added null checks and try-catch blocks in `sendAck()`
- Added null checks and error handling in `handleDriverAck()`
**Result:** Pit-side no longer crashes when driver acknowledges commands

---

## 4. ✅ Add Race Ops Lap Timing Section
**File:** `web/src/components/pit/RaceOpsTab.jsx`
**Changes:**
- Added new `LapTimer` component with:
  - Start/Stop/Lap buttons
  - Real-time elapsed time display (MM:SS.CC format)
  - Lap history with split times
  - Reset functionality
- Integrated into Race Ops tab layout
**Result:** Pit crew can now log lap times and view split history

---

## 5. ✅ Implement Pit-to-Driver Flag Highlighting System
**Files Modified:**
- `web/src/hooks/useRealtimeTelemetry.js` - Added `broadcastFlagChange()` and flag subscription
- `web/src/pages/PitCenter.jsx` - Added `handleFlagChange()` to broadcast flag changes
- `web/src/pages/DriverHUD.jsx` - Added flag banner overlay that displays when flag ≠ green
**Result:** When Pit/Director changes flag, Driver HUD instantly shows prominent color-coded banner (Yellow/Red/Black)

---

## 🚀 Testing Checklist

1. **SPA Refresh:** Navigate to `/pit`, refresh page - should stay on pit page
2. **Command Name:** Send command from pit, verify driver sees command text
3. **Ack Crash:** Driver acknowledges command, verify pit-side doesn't crash
4. **Lap Timer:** Go to Race Ops tab, test start/stop/lap/reset functionality
5. **Flag System:** Change flag in Race Ops, verify driver sees banner instantly

---

## 📝 No New Files Created
All fixes were made to existing files, maintaining your current architecture and code style.

---

# 7. QUICK START GUIDE

## ⚡ LIVE HARDWARE TELEMETRY SETUP

## ✅ Done Automatically:
1. Fixed `useTelemetry.js` - Added better error handling and debug logging
2. Fixed `TelemetryDashboard.jsx` - **FORCED to live hardware mode** (isDemoMode: false)
3. Fixed `useRealtimeTelemetry.js` - Disabled localhost WebSocket loops, uses Supabase directly
4. Created SQL file to enable Supabase Realtime

## 🔧 SETUP STEPS (Do these NOW):

### Step 1: Enable Supabase Realtime (1 minute)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"
5. Copy and paste this:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_logs;
```
6. Click "Run" (you might see "already in publication" - that's OK)

### Step 2: RESTART FRONTEND (Critical!)
```bash
# Stop the current dev server (Ctrl+C)
cd web
npm run dev
```
**The WebSocket loop errors will stop after restart!**

### Step 3: Start Python Bridge
```bash
cd gateway
python bridge_online.py
```
**Make sure your Heltec V3 Receiver is connected via USB!**

### Step 4: POWER ON YOUR HARDWARE
- Turn on your Heltec V3 Transmitter (on the vehicle)
- Turn on your Heltec V3 Receiver (connected to PC via USB)
- The bridge should start showing: `[HH:MM:SS] PKT #1 | 49.8V | 45.20A | 2250.9W -> [LIVE]`

### Step 5: Test in Browser
1. Open http://localhost:5173
2. **Login with PEGATSA@55** (Pit Engineer) - NOT DEMO@55!
3. Navigate to Telemetry Dashboard
4. Open browser console (F12)
5. Look for:
   - ✅ `[useTelemetry] Supabase Realtime subscription status: SUBSCRIBED`
   - ✅ `[useTelemetry] Successfully subscribed to telemetry_logs table`
   - ✅ `[useTelemetry] Received payload: {...}` (when data arrives from hardware)
   - ❌ NO MORE "WebSocket connection to ws://localhost:4000 failed" errors
6. **The gauges should now update with REAL data from your Heltec V3 hardware!**

## 🎯 LOGIN CREDENTIALS FOR LIVE MODE:
- **Pit Engineer**: `PEGATSA@55` ← USE THIS FOR LIVE HARDWARE
- **Driver**: `DGATSA@55` ← USE THIS FOR LIVE HARDWARE
- **Race Director**: `RDGATSA@55` ← USE THIS FOR LIVE HARDWARE

## ⚠️ DO NOT USE:
- **Demo Mode**: `DEMO@55` ← This shows simulated data, NOT real hardware

## 🔧 TROUBLESHOOTING:
- If gauges stay at 0.00: Check Python bridge console for errors
- If no subscription: Make sure Supabase Realtime SQL was run
- If no data arriving: Check that Heltec V3 hardware is powered on and connected

Good luck with the live hardware demo! 🚀

---

## 📞 Support

For issues or questions:
- Check this document first - most common issues are covered
- Review console logs in Arduino IDE, Python bridge, and browser
- Verify all prerequisites are installed correctly
- Check Supabase dashboard for database issues

---

**Last Updated:** 2026-10-06
**Version:** 1.0
**Document Type:** Master Software Documentation
