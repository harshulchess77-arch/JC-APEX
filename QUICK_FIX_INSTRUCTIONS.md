# ⚡ QUICK FIX FOR LIVE TELEMETRY DEMO

## ✅ Done Automatically:
1. Fixed `useTelemetry.js` - Added better error handling and debug logging
2. Fixed `TelemetryDashboard.jsx` - Explicitly set `isDemoMode: false` for live hardware
3. Fixed `useRealtimeTelemetry.js` - Disabled localhost WebSocket loops, uses Supabase directly
4. Created SQL file to enable Supabase Realtime

## 🔧 MANUAL STEPS (Do these NOW):

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

### Step 3: Start Python Bridge (if not running)
```bash
cd gateway
python bridge_online.py
```

### Step 4: Test in Browser
1. Open http://localhost:5173/telemetry-dashboard
2. Open browser console (F12)
3. Look for:
   - ✅ `[useTelemetry] Supabase Realtime subscription status: SUBSCRIBED`
   - ✅ `[useTelemetry] Successfully subscribed to telemetry_logs table`
   - ✅ `[useTelemetry] Received payload: {...}` (when data arrives)
   - ❌ NO MORE "WebSocket connection to ws://localhost:4000 failed" errors
4. The gauges should now update live!

## 🎯 DEMO MODE ALTERNATIVE

If live hardware isn't ready, switch to demo mode:

In `web/src/pages/TelemetryDashbaord.jsx` line 49, change:
```javascript
{ isDemoMode: false }  // Change to true
```

Demo mode will show simulated data without needing hardware.

## 📱 Demo Login Credentials:
- **Demo Mode**: `DEMO@55`
- **Pit Engineer**: `PEGATSA@55`
- **Driver**: `DGATSA@55`
- **Race Director**: `RDGATSA@55`

Good luck with the demo! 🚀
