# JC-APEX Production Deployment Guide

This guide provides step-by-step instructions for deploying the JC-APEX telemetry system to Supabase (database & realtime) and Vercel (web hosting).

---

## Prerequisites

- GitHub account with repository access: `harshulchess77-arch/JC-APEX`
- Supabase account (free tier is sufficient)
- Vercel account (free tier is sufficient)
- Local Git installation

---

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
3. Copy the entire contents of `database/schema.sql` from the repository
4. Paste into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter`)
6. Verify success message: "Success. No rows returned"

**What this does:**
- Creates `telemetry_logs` table with proper schema
- Creates indexes for fast queries
- Enables Row Level Security (RLS)
- Sets up public read/insert policies
- Enables Supabase Realtime for live telemetry
- Creates helper function `calculate_session_metrics` for PDF export

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

---

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

---

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

---

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

---

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

---

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

---

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

---

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

## SUPPORT

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Repository Issues: GitHub issues page for `harshulchess77-arch/JC-APEX`
