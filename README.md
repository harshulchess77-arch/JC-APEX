# JC-APEX Electrothon 48V Telemetry System

Real-time telemetry platform for Electrothon 48V electric competition vehicles using Heltec V3 LoRa modules, Supabase Realtime, and React dashboard.

## Quick Start (Demo Mode)

1. **Launch web dashboard:**
   ```bash
   cd web
   npm install
   npm run dev
   ```
   Open http://localhost:3000

2. **Enter demo mode:**
   - Click "⚡ Launch Demo Mode (DEMO@55)" on login page
   - Or enter passcode `DEMO@55` in any role field
   - Dashboard will show simulated 5 Hz telemetry

## Hardware Setup

### Firmware
- Upload `firmware/transmitter/transmitter.ino` to TX Heltec V3
- Upload `firmware/receiver/receiver.ino` to RX Heltec V3
- Both at 915 MHz, SF7, 5 Hz transmission

### Gateway
```bash
cd gateway
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Create `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run bridge:
```bash
python bridge_online.py --port COM7  # Windows
python bridge_online.py --port /dev/ttyUSB0  # Linux
```

### Database
Run SQL scripts in `database/` folder on your Supabase project:
- `schema.sql`
- `enable_realtime.sql`

## Role Passcodes

- **Pit Engineer:** `PEGATSA@55`
- **Driver HUD:** `DGATSA@55`
- **Race Director:** `RDGATSA@55`
- **Demo Mode:** `DEMO@55`

## Routes

- `/` - Landing page
- `/login` - Role selection
- `/pit` - Pit Center (strategy, telemetry, comms)
- `/driver` - Driver HUD (speed, battery, alerts)
- `/director` - Race Director (flags, system health)
- `/telemetry-dashboard` - Live telemetry visualization
- `/circuit-map` - GPS track visualization
- `/strategy-library` - Strategy presets

## Key Features

- **5 Hz LoRa telemetry** (200ms intervals)
- **48V battery monitoring** with calibrated voltage divider
- **WCS1600 Hall effect current sensor** with EMA filtering
- **GPS tracking** with TinyGPS++ (non-blocking)
- **Hall effect speed sensor** with interrupt debouncing
- **Supabase Realtime** for live data streaming
- **Demo mode** for testing without hardware
- **Recharts** for real-time visualization
- **F1-style UI** with Carbon Dark theme

## Troubleshooting

- **No telemetry:** Check gateway is running and JSON streaming
- **GPS not working:** Verify TX OLED shows "GPS: LOCK"
- **Voltage incorrect:** Recalibrate `BATT_VOLTAGE_DIVIDER_FACTOR` in transmitter
- **LoRa not connecting:** Check both devices at 915 MHz, SF7, sync word 0x12

## Documentation

See `JC-APEX_SYSTEM.md` for complete technical documentation.

## License

Proprietary - JC APEX Racing Team
