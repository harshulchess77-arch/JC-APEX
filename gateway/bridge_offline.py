"""
Offline Field Bridge - Serial to CSV Logger
Reads USB Serial from ESP32 Receiver and logs to local CSV file for zero-network field testing

Requirements:
- pip install pyserial python-dotenv

Usage:
- python bridge_offline.py --port COM3
- python bridge_offline.py --port /dev/ttyUSB0
- python bridge_offline.py  # Auto-detect port
"""

import serial
import serial.tools.list_ports
import json
import os
import sys
import time
import argparse
import queue
import threading
from datetime import datetime, timezone
from typing import Optional

# Configuration
SERIAL_BAUD = 115200
SERIAL_TIMEOUT = 1

class OfflineTelemetryLogger:
    def __init__(self, serial_port: Optional[str] = None):
        self.serial_port = serial_port
        self.serial_conn: Optional[serial.Serial] = None
        self.session_id = self._generate_session_id()
        self.csv_file = f"session_{self.session_id}.csv"
        self.running = True
        self.serial_queue = queue.Queue()
        self.serial_thread: Optional[threading.Thread] = None
        self.last_packet_id = -1
        self.packet_loss_count = 0

    def _generate_session_id(self) -> str:
        """Generate a unique session ID for this run"""
        return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    def auto_detect_serial_port(self) -> Optional[str]:
        """Auto-detect active USB Serial port, prioritizing Silicon Labs CP210x / USB Serial devices"""
        ports = serial.tools.list_ports.comports()
        print("Available serial ports:")
        for port in ports:
            print(f"  - {port.device}: {port.description}")

        # Try to find likely ESP32 port (Silicon Labs CP210x / USB Serial)
        for port in ports:
            desc_lower = port.description.lower()
            if 'cp210' in desc_lower or 'silicon labs' in desc_lower:
                print(f"Auto-detected Silicon Labs CP210x: {port.device}")
                return port.device
            if 'usb' in desc_lower or 'uart' in desc_lower or 'ch340' in desc_lower:
                print(f"Auto-detected USB Serial: {port.device}")
                return port.device

        # If no obvious match, use first available
        if ports:
            print(f"Using first available: {ports[0].device}")
            return ports[0].device

        return None

    def connect_serial(self) -> bool:
        """Connect to the serial port"""
        port_to_use = self.serial_port or self.auto_detect_serial_port()

        if not port_to_use:
            print("ERROR: No serial port found or specified")
            return False

        try:
            self.serial_conn = serial.Serial(
                port_to_use,
                SERIAL_BAUD,
                timeout=SERIAL_TIMEOUT
            )
            print(f"Connected to {port_to_use} at {SERIAL_BAUD} baud")
            return True
        except serial.SerialException as e:
            print(f"Failed to connect to serial port: {e}")
            return False

    def validate_telemetry(self, data: dict) -> bool:
        """Validate incoming telemetry data structure with flexible key support"""
        # Support both primary and legacy field names
        packet_id = data.get("id") or data.get("packet_id", 0)
        amps = data.get("amps") or data.get("current", 0.0)
        volts = data.get("volts") or data.get("voltage", 0.0)
        rssi = data.get("rssi")
        snr = data.get("snr")

        if rssi is None or snr is None:
            print(f"Validation error: Missing required fields (rssi, snr) - got {list(data.keys())}")
            return False

        # Validate data types
        try:
            int(packet_id)
            float(amps)
            float(volts)
            int(rssi)
            float(snr)
        except (ValueError, TypeError) as e:
            print(f"Validation error: Invalid data type - {e}")
            return False

        return True

    def process_telemetry(self, raw_line: str):
        """Process incoming telemetry line and append to CSV"""
        try:
            data = json.loads(raw_line.strip())

            if not self.validate_telemetry(data):
                return

            # Extract fields with fallback to legacy names
            packet_id = int(data.get("id") or data.get("packet_id", 0))
            amps = float(data.get("amps") or data.get("current", 0.0))
            volts = float(data.get("volts") or data.get("voltage", 0.0))
            watts = float(data.get("watts") or data.get("power", 0.0))
            speed_h = float(data.get("speed_h") or data.get("speed_hall", 0.0))
            speed_g = float(data.get("speed_g") or data.get("speed_gps", 0.0))
            rssi = int(data.get("rssi", -80))
            snr = float(data.get("snr", 9.0))

            # Track packet loss by detecting gaps in packet_id
            if self.last_packet_id >= 0:
                gap = packet_id - (self.last_packet_id + 1)
                if gap > 0:
                    self.packet_loss_count += gap
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Packet loss detected: {gap} packets missing (total lost: {self.packet_loss_count})")

            self.last_packet_id = packet_id

            # Prepare CSV row with full telemetry data
            timestamp = datetime.now(timezone.utc).isoformat()
            csv_row = f"{timestamp},{packet_id},{volts:.2f},{amps:.2f},{watts:.2f},{speed_h:.2f},{speed_g:.2f},{rssi},{snr:.1f}\n"

            # Append to CSV file
            with open(self.csv_file, 'a') as f:
                f.write(csv_row)

            print(f"[{datetime.now().strftime('%H:%M:%S')}] PKT #{packet_id:<5} | {volts:>5.1f}V | {amps:>5.2f}A | {watts:>6.1f}W | SpdH: {speed_h:>4.1f}mph | GPS: {speed_g:>4.1f}mph | RSSI: {rssi:>4}dBm -> [CSV]")

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Error processing telemetry: {e}")

    def initialize_csv(self):
        """Create CSV file with header matching cloud schema"""
        header = "timestamp,id,volts,amps,watts,speed_h,speed_g,rssi,snr\n"
        with open(self.csv_file, 'w') as f:
            f.write(header)
        print(f"Initialized CSV file: {self.csv_file}")

    def serial_reader_thread(self):
        """Thread-safe serial reader that puts data into queue"""
        while self.running and self.serial_conn and self.serial_conn.is_open:
            try:
                if self.serial_conn.in_waiting > 0:
                    line = self.serial_conn.readline().decode('utf-8', errors='ignore')
                    if line.strip():
                        self.serial_queue.put(line.strip())
                else:
                    time.sleep(0.001)  # Small sleep to prevent CPU spinning
            except serial.SerialException as e:
                print(f"Serial read error in thread: {e}")
                break
            except Exception as e:
                print(f"Unexpected error in serial thread: {e}")
                break

    def run(self):
        """Main loop with infinite retry logic and threaded serial reading"""
        print(f"Session ID: {self.session_id}")
        print(f"CSV Output: {self.csv_file}")
        print("Listening for telemetry data...")
        print("Press Ctrl+C to stop")

        # Initialize CSV file
        self.initialize_csv()

        try:
            while self.running:
                if not self.connect_serial():
                    print("Retrying in 2 seconds...")
                    time.sleep(2)
                    continue

                # Start serial reader thread
                self.serial_thread = threading.Thread(target=self.serial_reader_thread, daemon=True)
                self.serial_thread.start()

                try:
                    while self.running and self.serial_conn and self.serial_conn.is_open:
                        # Process data from queue (non-blocking)
                        try:
                            line = self.serial_queue.get(timeout=0.1)
                            self.process_telemetry(line)
                        except queue.Empty:
                            continue
                        except Exception as e:
                            print(f"Error processing queue item: {e}")

                except serial.SerialException as e:
                    print(f"Serial connection lost: {e}")
                    if self.serial_conn:
                        self.serial_conn.close()
                    if self.serial_thread and self.serial_thread.is_alive():
                        self.serial_thread.join(timeout=1)
                    print("Reconnecting in 2 seconds...")
                    time.sleep(2)

        except KeyboardInterrupt:
            print("\nShutting down...")
            self.running = False

        finally:
            if self.serial_conn:
                self.serial_conn.close()
            if self.serial_thread and self.serial_thread.is_alive():
                self.serial_thread.join(timeout=1)
            print(f"Session complete. Data saved to: {self.csv_file}")
            print(f"Total packets lost: {self.packet_loss_count}")

def main():
    parser = argparse.ArgumentParser(description='Offline field telemetry logger')
    parser.add_argument('--port', type=str, help='Serial port (e.g., COM3 or /dev/ttyUSB0)')
    args = parser.parse_args()

    logger = OfflineTelemetryLogger(args.port)
    logger.run()

if __name__ == "__main__":
    main()
