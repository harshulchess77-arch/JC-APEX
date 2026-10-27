#!/usr/bin/env python3
"""
================================================================================
JC-APEX UNIFIED TELEMETRY BRIDGE v2.1 (NON-BLOCKING ASYNC QUEUE)
================================================================================
Reads 5 Hz JSON telemetry frames from Heltec WiFi LoRa 32 (V3) Receiver over
USB Serial (115200 baud), writes immediately to a local fault-tolerant CSV
backup, and streams asynchronously to Supabase Realtime via a background
worker thread so network latency never blocks serial reception.

RACE-DEPLOYMENT READY:
- Non-blocking serial I/O (never waits for network)
- Immediate CSV write guarantee (zero data loss)
- Background thread Supabase upload (cellular lag immunity)
- wh (watt-hours) cumulative energy tracking
================================================================================
"""

import os
import sys
import time
import json
import queue
import signal
import argparse
import threading
from datetime import datetime, timezone

import serial
import serial.tools.list_ports
import requests
from dotenv import load_dotenv

load_dotenv()


class UnifiedTelemetryBridge:
    def __init__(self, mode="online", serial_port=None, baud_rate=115200):
        self.mode = mode.lower()
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.ser = None
        self.running = True
        self.last_packet_id = -1

        # Supabase configuration
        self.supabase_url = (os.getenv("SUPABASE_URL") or "").rstrip("/")
        self.supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
            or os.getenv("VITE_SUPABASE_ANON_KEY")
            or ""
        )
        self.table_name = os.getenv("SUPABASE_TABLE", "telemetry_logs")
        self.schema_fallback_active = False

        if self.mode == "online" and (not self.supabase_url or not self.supabase_key):
            print("[WARN] Supabase credentials missing in .env. Falling back to OFFLINE (CSV-only) mode.")
            self.mode = "offline"

        self.live_upload_enabled = self.mode == "online"

        # Local CSV session backup
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_id = f"SES_{timestamp_str}"
        os.makedirs("sessions", exist_ok=True)
        self.csv_backup = os.path.join("sessions", f"session_{self.session_id}.csv")
        self._init_csv_backup()

        # Non-blocking background upload queue & worker thread
        self.upload_queue = queue.Queue(maxsize=500)
        self.http_session = requests.Session()
        if self.live_upload_enabled:
            self.worker_thread = threading.Thread(target=self._supabase_worker, daemon=True)
            self.worker_thread.start()

    def _init_csv_backup(self):
        with open(self.csv_backup, "w", encoding="utf-8") as f:
            f.write(
                "timestamp,id,volts,amps,watts,wh,speed_h,speed_g,"
                "latitude,longitude,sats,rssi,snr\n"
            )
        print(f"[CSV BACKUP] Logging all frames to: {self.csv_backup}")

    def auto_detect_serial_port(self):
        ports = serial.tools.list_ports.comports()
        candidates = []
        for p in ports:
            desc = (p.description or "").lower()
            hwid = (p.hwid or "").lower()
            if "cp210" in desc or "silicon labs" in desc or "10c4:ea60" in hwid:
                candidates.insert(0, p.device)
            elif any(k in desc for k in ["usb", "uart", "ch340", "heltec", "serial", "espressif"]):
                candidates.append(p.device)

        if candidates:
            print(f"[AUTO-DETECT] Selected serial port: {candidates[0]}")
            return candidates[0]
        return None

    def connect(self):
        port_to_use = self.serial_port or self.auto_detect_serial_port()
        if not port_to_use:
            print("[SERIAL ERR] No Heltec V3 USB Serial device detected.")
            return False

        try:
            self.ser = serial.Serial(port_to_use, self.baud_rate, timeout=1.0)
            self.ser.reset_input_buffer()
            print(f"[SERIAL OK] Connected to {port_to_use} at {self.baud_rate} baud.")
            return True
        except serial.SerialException as e:
            print(f"[SERIAL ERR] Could not open {port_to_use}: {e}")
            return False

    def _supabase_worker(self):
        """Background thread that uploads telemetry frames without blocking USB Serial."""
        endpoint = f"{self.supabase_url}/rest/v1/{self.table_name}"
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

        while self.running:
            try:
                payload = self.upload_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            try:
                res = self.http_session.post(endpoint, headers=headers, json=payload, timeout=1.5)

                # Automatic fallback if database schema does not yet have newer columns (e.g. 'wh')
                if res.status_code == 400 and not self.schema_fallback_active:
                    print("[SUPABASE NOTICE] Retrying without extended columns ('wh')...")
                    self.schema_fallback_active = True

                if self.schema_fallback_active and "wh" in payload:
                    fallback_payload = {k: v for k, v in payload.items() if k != "wh"}
                    self.http_session.post(endpoint, headers=headers, json=fallback_payload, timeout=1.5)

            except requests.RequestException as e:
                print(f"[NETWORK WARN] Supabase upload timeout/error (saved in CSV): {e}")
            finally:
                self.upload_queue.task_done()

    def process_line(self, raw_line):
        if not raw_line.startswith("{") or not raw_line.endswith("}"):
            return

        try:
            data = json.loads(raw_line)
        except json.JSONDecodeError:
            return

        if "error" in data:
            print(f"[RX HARDWARE ERR] {data}")
            return

        # Flexible field extraction (supports v2.1 and legacy field names)
        packet_id = int(data.get("id") or data.get("packet_id") or 0)
        amps      = float(data.get("amps") or data.get("current") or 0.0)
        volts     = float(data.get("volts") or data.get("voltage") or 0.0)
        watts     = float(data.get("watts") or data.get("power") or (volts * amps))
        wh        = float(data.get("wh") or data.get("watt_hours") or 0.0)
        speed_h   = float(data.get("speed_h") or data.get("speed_hall") or 0.0)
        speed_g   = float(data.get("speed_g") or data.get("speed_gps") or 0.0)
        lat       = float(data.get("lat") or data.get("latitude") or 0.0)
        lng       = float(data.get("lng") or data.get("longitude") or 0.0)
        sats      = int(data.get("sats") or data.get("satellites") or 0)
        rssi      = int(data.get("rssi") or 0)
        snr       = float(data.get("snr") or 0.0)

        # Packet gap diagnostics
        if self.last_packet_id >= 0 and packet_id > (self.last_packet_id + 1):
            gap = packet_id - (self.last_packet_id + 1)
            print(f"⚠️  PACKET GAP: {gap} packet(s) dropped between #{self.last_packet_id} and #{packet_id}")
        self.last_packet_id = packet_id

        iso_time = datetime.now(timezone.utc).isoformat()

        # 1. Always write to local CSV immediately (Zero data loss guarantee)
        with open(self.csv_backup, "a", encoding="utf-8") as f:
            f.write(
                f"{iso_time},{packet_id},{volts:.2f},{amps:.2f},{watts:.1f},{wh:.1f},"
                f"{speed_h:.1f},{speed_g:.1f},{lat:.6f},{lng:.6f},{sats},{rssi},{snr:.1f}\n"
            )

        # 2. Enqueue for non-blocking Supabase Realtime upload
        if self.live_upload_enabled:
            payload = {
                "packet_id": packet_id,
                "volts": round(volts, 2),
                "amps": round(amps, 2),
                "watts": round(watts, 1),
                "wh": round(wh, 1),
                "speed_h": round(speed_h, 1),
                "speed_g": round(speed_g, 1),
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "sats": sats,
                "rssi": rssi,
                "snr": round(snr, 1),
                "created_at": iso_time,
            }
            if not self.upload_queue.full():
                self.upload_queue.put_nowait(payload)

        mode_tag = "[LIVE]" if self.live_upload_enabled else "[CSV]"
        print(
            f"[{datetime.now().strftime('%H:%M:%S')}] PKT #{packet_id:<5} | "
            f"{volts:>5.2f}V | {amps:>5.2f}A | {watts:>6.1f}W | {wh:>5.1f}Wh | "
            f"SpdH: {speed_h:>4.1f}mph | GPS: {speed_g:>4.1f}mph | "
            f"Sats: {sats:>2} | RSSI: {rssi:>4}dBm -> {mode_tag}"
        )

    def run(self):
        retry_delay = 3
        while self.running:
            if not self.ser or not self.ser.is_open:
                if not self.connect():
                    print(f"[RECONNECT] Retrying serial connection in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay = min(retry_delay * 2, 30)
                    continue
                retry_delay = 3

            try:
                raw_bytes = self.ser.readline()
                if not raw_bytes:
                    continue
                line = raw_bytes.decode("utf-8", errors="ignore").strip()
                if line:
                    self.process_line(line)
            except serial.SerialException as e:
                print(f"[SERIAL DISCONNECTED] {e}. Attempting automatic reconnect...")
                try:
                    self.ser.close()
                except Exception:
                    pass
                self.ser = None
                time.sleep(2)
            except Exception as e:
                print(f"[BRIDGE ERR] Unexpected error: {e}")

    def stop(self):
        print("\n[SHUTDOWN] Closing JC-APEX Telemetry Bridge...")
        self.running = False
        if self.ser and self.ser.is_open:
            self.ser.close()


def main():
    parser = argparse.ArgumentParser(description="JC-APEX Unified Telemetry Bridge v2.1")
    parser.add_argument("--mode", choices=["online", "offline"], default="online", help="Operation mode")
    parser.add_argument("--port", type=str, default=None, help="Explicit serial port (e.g. COM3 or /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=115200, help="Serial baud rate (default: 115200)")
    args = parser.parse_args()

    print("=" * 70)
    print("JC-APEX TELEMETRY BRIDGE v2.1 (NON-BLOCKING ASYNC QUEUE)")
    print("=" * 70)
    print(f"Mode: {args.mode.upper()}")
    print(f"Baud Rate: {args.baud}")
    print("=" * 70)

    bridge = UnifiedTelemetryBridge(mode=args.mode, serial_port=args.port, baud_rate=args.baud)

    def sigint_handler(sig, frame):
        bridge.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, sigint_handler)
    bridge.run()


if __name__ == "__main__":
    main()
