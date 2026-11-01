# JC-APEX Telemetry Platform

F1-inspired race telemetry and strategy platform for electric vehicle racing.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (create `.env` file):
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Run Modes

- **DEMO Mode**: Simulated telemetry (no hardware, no internet) - enabled via passcode auth
- **LIVE Mode**: Real hardware telemetry via LoRa/GPS → Python bridge → Supabase → UI

## Project Map

- `/` - Landing page
- `/login` - Role selection (Pit Engineer, Driver, Race Director)
- `/pit` - Pit Center (main dashboard with telemetry, commands, strategy)
- `/driver` - Driver HUD (speedometer, telemetry, command overlays)

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Hardware**: Heltec V3 ESP32-S3 (LoRa 915 MHz + GPS)
- **Bridge**: Python serial bridge (gateway/run_bridge.py)

## Design System

- **Colors**: Carbon (#08090C), Crimson (#FF1E42), Data Cyan (#00E5FF), Signal Green (#00E676), Warning Gold (#FFB300)
- **Fonts**: JetBrains Mono (data), Inter (body), Orbitron (display)
- **Style**: F1-inspired "Pit Wall" aesthetic with liquid glass effects on floating layers only

## Data Pipeline

Hardware → Serial → Python Bridge → Supabase (telemetry_logs) → Realtime → React UI (5 Hz)
