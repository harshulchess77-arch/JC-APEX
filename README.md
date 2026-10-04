# JC APEX Telemetry System

End-to-end real-time hardware telemetry pipeline using dual Heltec V3 ESP32 SX1262 LoRa modules, WCS1600 current sensor, Python local bridge gateway (with offline-first field capability), Supabase Realtime, and a Vercel-hosted web application with auto-export PDF report generation.

## Repository Structure

```
/
├── firmware/
│   ├── transmitter/
│   │   └── transmitter.ino          # Heltec V3 ESP32 TX + WCS1600 Sensor Logic
│   └── receiver/
│       └── receiver.ino             # Heltec V3 ESP32 RX + USB Serial Gateway Logic
├── gateway/
│   ├── bridge_offline.py            # Field Test Serial-to-CSV Logger
│   ├── sync_offline_data.py         # Post-Field CSV-to-Supabase Sync Script
│   └── requirements.txt             # Python dependencies (pyserial, requests)
├── database/
│   └── schema.sql                   # Supabase SQL table definitions, RLS policies, and Realtime setup
├── web/                             # Next.js / Vercel Application Root
│   ├── src/
│   │   ├── pages/                   # Existing routes & UI views (UNTOUCHED)
│   │   ├── hooks/
│   │   │   ├── useTelemetry.js     # Clean Supabase Realtime data hook
│   │   │   └── useMockTelemetry.jsx # Mock telemetry hook for testing
│   │   └── lib/
│   │       └── supabaseClient.js   # Unified Supabase client initialization
│   ├── api/
│   │   └── export-pdf.js            # Automated PDF Report Generator Endpoint
│   ├── package.json                 # Web app dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── vercel.json                  # Vercel deployment configuration
│   └── .env.example                 # Sample environment variables
└── README.md
```

## Hardware Wiring

### WCS1600 Sensor to ESP32 Transmitter

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

## Deployment & Configuration

### Step 1: Supabase Database Setup

1. Log into your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run `database/schema.sql` to create tables, policies, and enable Realtime

**Schema Summary:**
- Table: `telemetry_logs`
  - `id` (UUID, primary key)
  - `session_id` (TEXT, indexed)
  - `packet_id` (BIGINT)
  - `current` (NUMERIC(8,2))
  - `rssi` (NUMERIC(5,1))
  - `snr` (NUMERIC(5,1))
  - `created_at` (TIMESTAMPTZ, indexed)
- RLS: Allow anon insert and select for testing
- Realtime: Published to `supabase_realtime`

### Step 2: Arduino IDE Setup

1. Install Arduino IDE
2. Install ESP32 board support
3. Install libraries:
   - RadioLib
   - ArduinoJson
4. Select board: "Heltec WiFi LoRa 32 V3"
5. Upload firmware:
   - `firmware/transmitter/transmitter.ino` to TX node
   - `firmware/receiver/receiver.ino` to RX node

### Step 3: Python Gateway Setup

```bash
cd gateway
pip install -r requirements.txt
```

**Create `.env` file in root directory:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Web Application Setup

```bash
cd web
npm install
```

**Create `.env` file in web/ directory:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Vercel Environment Configuration

In your Vercel Project Settings, add:

- `VITE_SUPABASE_URL`: `https://<YOUR_PROJECT_REF>.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `<YOUR_SUPABASE_ANON_KEY>`
- `SUPABASE_SERVICE_ROLE_KEY`: `<YOUR_SUPABASE_SERVICE_ROLE_KEY>` (for PDF generation)

## Operation Modes

### Online Mode (Live Streaming)

**Note:** The online bridge has been removed. Use offline mode for field testing and sync data afterward, or implement your own online bridge based on the offline bridge pattern.

**Setup:**
1. Power transmitter with USB power bank
2. Connect receiver to laptop via USB
3. Ensure laptop has internet connection
4. Run offline bridge for testing:

```bash
python gateway/bridge_offline.py --port COM3  # Windows
python gateway/bridge_offline.py --port /dev/ttyUSB0  # Linux/Mac
python gateway/bridge_offline.py  # Auto-detect
```

**Flow:**
```
[WCS1600] → [ESP32 TX] → (915MHz LoRa) → [ESP32 RX] → (USB) → [Laptop CSV Logger]
```

### Offline Mode (Field Testing)

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

### Post-Field Data Sync

**When internet is restored:**

```bash
python gateway/sync_offline_data.py --file session_20261004_150000.csv
```

**Process:**
1. Reads CSV file
2. Validates data
3. Bulk inserts to Supabase (100 records per batch)
4. Reports sync status

## Frontend Integration

### Realtime Hook Usage

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

### Mock Telemetry Hook

For testing without hardware:

```javascript
import { useTelemetry } from '@/hooks/useMockTelemetry';

function Dashboard() {
  const { telemetry, chartData, formatTime } = useTelemetry();
  // Returns simulated telemetry data
}
```

### PDF Export

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

### Running the Web Application

```bash
cd web
npm run dev    # Development server
npm run build  # Production build
npm run preview # Preview production build
```

## Troubleshooting

### No Serial Connection
- Check USB cable is data-capable (not charge-only)
- Verify correct COM port / device path
- Check device manager / dmesg for device recognition

### No LoRa Packets
- Verify both ESP32s powered on
- Check frequency matching (915.0 MHz)
- Ensure RadioLib parameters match (SF7, BW125, CR5)
- Check antenna connections

### Gateway Not Connecting to Supabase
- Verify `.env` file exists
- Check SUPABASE_URL and SUPABASE_ANON_KEY
- Test Supabase connection in Supabase dashboard
- Verify REST endpoint is accessible

### Dashboard Shows Mock Mode
- Check gateway is running
- Verify JSON streaming in terminal
- Check browser console for errors
- Verify Supabase Realtime enabled for `telemetry_logs`

### PDF Export Fails
- Verify session ID exists in database
- Check Vercel environment variables
- Verify SUPABASE_SERVICE_ROLE_KEY has write access
- Check Vercel function logs

## Performance Specifications

- **Transmission Rate:** 5 Hz (200ms intervals)
- **Moving Average:** 50-sample window
- **Database Indexing:** Optimized on session_id and created_at
- **Realtime Latency:** Sub-second updates via postgres_changes
- **Current Range:** ±75 A (WCS1600 spec)
- **ADC Resolution:** 12-bit (0-4095)
- **LoRa Range:** Up to 15 km (line of sight, SF7)

## Security Notes

- LoRa transmissions are unencrypted (add encryption if needed)
- Supabase RLS policies allow anon insert for gateway
- Use service role key only for server-side operations
- Never commit `.env` files to Git
- Rotate API keys regularly

## License

Proprietary - JC APEX Racing Telemetry System
