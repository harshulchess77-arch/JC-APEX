# ⚡ LIVE HARDWARE TELEMETRY SETUP

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

## � TROUBLESHOOTING:
- If gauges stay at 0.00: Check Python bridge console for errors
- If no subscription: Make sure Supabase Realtime SQL was run
- If no data arriving: Check that Heltec V3 hardware is powered on and connected

Good luck with the live hardware demo! 🚀
