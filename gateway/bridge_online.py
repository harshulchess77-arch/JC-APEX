"""
================================================================================
  JC-APEX LIVE TELEMETRY BRIDGE - SERIAL TO SUPABASE REALTIME
  ELECTROTHON 48V TRACTIVE SYSTEM, MOTOR HALL & GPS INTEGRATION
================================================================================
Reads USB Serial from the Heltec V3 ESP32 Receiver, validates incoming JSON
telemetry frames (amps, volts, watts, speed_hall, speed_gps, lat, lng, rssi, snr),
logs to local CSV backup, and pushes in real-time to the Supabase `telemetry_logs`
table.

Requirements:
- pip install pyserial requests python-dotenv

Usage:
- python bridge_online.py                     # Auto-detects Heltec USB port
- python bridge_online.py --port COM3         # Windows explicit COM port
- python bridge_online.py --port /dev/ttyUSB0 # Linux / macOS port
================================================================================
"""

import os
import sys
import time
import json
import argparse
import requests
from datetime import datetime, timezone
import serial
import serial.tools.list_ports
from dotenv import load_dotenv

# Load Supabase credentials from local .env or parent directory
load_dotenv()

SERIAL_BAUD = 115200
SERIAL_TIMEOUT = 1.0


class OnlineTelemetryBridge:
    def __init__(self, serial_port=None):
        self.serial_port = serial_port
        self.serial_conn = None
        self.session_id = datetime.now(timezone.utc).strftime("SES_%Y%m%d_%H%M%S")
        self.csv_backup = f"session_{self.session_id}.csv"
        self.packet_count = 0
        self.error_count = 0
        self.last_packet_id = -1
        self.running = True
        self.schema_fallback_active = False

        # Supabase Configuration
        self.supabase_url = os.getenv('SUPABASE_URL')
        # Use service role key if available, else anon key
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')

        if not self.supabase_url or not self.supabase_key:
            print("\n[CONFIG WARNING] Missing SUPABASE_URL or SUPABASE_KEY in environment!")
            print("Telemetry will be logged locally to CSV but not sent to live database.\n")
            self.live_upload_enabled = False
        else:
            self.live_upload_enabled = True
            self.rest_url = f"{self.supabase_url.rstrip('/')}/rest/v1/telemetry_logs"
            self.headers = {
                'apikey': self.supabase_key,
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }

        # Initialize CSV Backup File
        self._init_csv_backup()

    def _init_csv_backup(self):
        try:
            with open(self.csv_backup, 'w') as f:
                f.write("session_id,packet_id,current,voltage,power,speed_hall,speed_gps,latitude,longitude,rssi,snr,timestamp\n")
        except Exception as e:
            print(f"[BACKUP WARNING] Could not initialize CSV file: {e}")

    def auto_detect_serial_port(self):
        """Auto-detects CP210x, CH340, or Heltec USB Serial port."""
        ports = serial.tools.list_ports.comports()
        print("\n[SERIAL] Scanning available ports:")
        candidates = []
        for p in ports:
            print(f"  - {p.device}: {p.description}")
            desc = (p.description or '').lower()
            if any(k in desc for k in ['usb', 'uart', 'cp210', 'ch340', 'heltec', 'serial', 'espressif']):
                candidates.append(p.device)

        if candidates:
            print(f"[SERIAL] Auto-selected candidate port: {candidates[0]}")
            return candidates[0]
        elif ports:
            print(f"[SERIAL] Defaulting to first available port: {ports[0].device}")
            return ports[0].device

        return None

    def connect(self):
        port_to_use = self.serial_port or self.auto_detect_serial_port()
        if not port_to_use:
            print("\n[SERIAL ERROR] No serial port detected. Please connect your Heltec V3 Receiver.")
            return False

        try:
            self.serial_conn = serial.Serial(port_to_use, SERIAL_BAUD, timeout=SERIAL_TIMEOUT)
            print(f"[SERIAL OK] Connected to {port_to_use} at {SERIAL_BAUD} baud.")
            print(f"[SESSION ID] {self.session_id}")
            print(f"[CSV BACKUP] {self.csv_backup}")
            return True
        except Exception as e:
            print(f"[SERIAL ERROR] Failed to open port {port_to_use}: {e}")
            return False

    def push_to_supabase(self, payload):
        """Sends single telemetry record to Supabase via REST POST."""
        if not self.live_upload_enabled:
            return

        try:
            res = requests.post(self.rest_url, json=payload, headers=self.headers, timeout=2.0)
            if res.status_code in (200, 201, 204):
                return

            # If Supabase complains about missing columns in telemetry_logs, fall back to core columns
            if res.status_code == 400 and not self.schema_fallback_active:
                print(f"[SUPABASE SCHEMA NOTICE] Database schema missing new 48V columns: {res.text}")
                print("[SUPABASE FALLBACK] Retrying with core telemetry schema until migration is run...")
                self.schema_fallback_active = True
                legacy_payload = {
                    "session_id": payload["session_id"],
                    "packet_id": payload["packet_id"],
                    "current": payload["current"],
                    "rssi": payload["rssi"],
                    "snr": payload["snr"],
                    "created_at": payload["created_at"]
                }
                requests.post(self.rest_url, json=legacy_payload, headers=self.headers, timeout=2.0)
            else:
                print(f"[SUPABASE ERROR] Status {res.status_code}: {res.text}")

        except Exception as e:
            print(f"[SUPABASE EXCEPTION] {e}")

    def run(self):
        if not self.connect():
            return

        print("\n========================================================")
        print("  JC-APEX BRIDGE ONLINE - LISTENING FOR 48V LORA DATA   ")
        print("========================================================\n")

        # Give serial port a moment to stabilize
        time.sleep(1.0)
        self.serial_conn.reset_input_buffer()

        while self.running:
            try:
                line_bytes = self.serial_conn.readline()
                if not line_bytes:
                    continue

                line_str = line_bytes.decode('utf-8', errors='ignore').strip()
                if not line_str:
                    continue

                # Defensive check: Only accept curly-braced JSON strings
                if not line_str.startswith('{') or not line_str.endswith('}'):
                    continue

                try:
                    data = json.loads(line_str)
                except json.JSONDecodeError:
                    # Gracefully ignore partial or corrupted serial lines caused by car vibration
                    continue

                # Extract packet metrics supporting both new format and legacy aliases
                packet_id = int(data.get('id') if 'id' in data else data.get('packet_id', 0))
                current_amps = float(data.get('amps') if 'amps' in data else data.get('current', 0.0))
                voltage_volts = float(data.get('volts') if 'volts' in data else data.get('voltage', 0.0))
                
                # Derive or extract power in Watts
                if 'watts' in data:
                    power_watts = float(data['watts'])
                elif 'power' in data:
                    power_watts = float(data['power'])
                else:
                    power_watts = round(voltage_volts * current_amps, 2)

                speed_hall = float(data.get('speed_h') if 'speed_h' in data else data.get('speed_hall', 0.0))
                speed_gps = float(data.get('speed_g') if 'speed_g' in data else data.get('speed_gps', 0.0))
                lat = float(data.get('lat') if 'lat' in data else data.get('latitude', 0.0))
                lng = float(data.get('lng') if 'lng' in data else data.get('longitude', 0.0))
                rssi = int(data.get('rssi', -80))
                snr = float(data.get('snr', 9.0))
                iso_time = datetime.now(timezone.utc).isoformat()

                self.packet_count += 1

                # Check for dropped packet gaps
                if self.last_packet_id >= 0 and packet_id > (self.last_packet_id + 1):
                    gap = packet_id - (self.last_packet_id + 1)
                    print(f"⚠️  PACKET GAP: {gap} packet(s) dropped between #{self.last_packet_id} and #{packet_id}")

                self.last_packet_id = packet_id

                # Console Telemetry Visualizer
                print(f"[{datetime.now().strftime('%H:%M:%S')}] PKT #{packet_id:<5} | "
                      f"{voltage_volts:>5.1f}V | {current_amps:>5.2f}A | {power_watts:>6.1f}W | "
                      f"SpdH: {speed_hall:>4.1f}mph | GPS: {speed_gps:>4.1f}mph | "
                      f"RSSI: {rssi:>4}dBm -> [LIVE]")

                # 1. Append to local CSV backup
                try:
                    with open(self.csv_backup, 'a') as f:
                        f.write(f"{self.session_id},{packet_id},{current_amps:.2f},{voltage_volts:.2f},{power_watts:.2f},"
                                f"{speed_hall:.2f},{speed_gps:.2f},{lat:.6f},{lng:.6f},{rssi},{snr:.1f},{iso_time}\n")
                except Exception:
                    pass

                # 2. Push directly to Supabase telemetry_logs table
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

                if self.schema_fallback_active:
                    legacy_payload = {
                        "session_id": self.session_id,
                        "packet_id": packet_id,
                        "current": round(current_amps, 2),
                        "rssi": rssi,
                        "snr": round(snr, 1),
                        "created_at": iso_time
                    }
                    self.push_to_supabase(legacy_payload)
                else:
                    self.push_to_supabase(db_payload)

            except KeyboardInterrupt:
                print("\n[SHUTDOWN] Stopping telemetry bridge...")
                self.running = False
                break
            except Exception as e:
                print(f"[BRIDGE EXCEPTION] {e}")
                time.sleep(0.1)

        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
            print("[SERIAL] Port closed.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="JC-APEX USB Serial to Supabase Bridge")
    parser.add_argument('--port', type=str, default=None, help="Serial port (e.g. COM3 or /dev/ttyUSB0)")
    args = parser.parse_args()

    bridge = OnlineTelemetryBridge(serial_port=args.port)
    bridge.run()
