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
import argparse
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

    def _generate_session_id(self) -> str:
        """Generate a unique session ID for this run"""
        return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    def auto_detect_serial_port(self) -> Optional[str]:
        """Auto-detect active USB Serial port"""
        ports = serial.tools.list_ports.comports()
        print("Available serial ports:")
        for port in ports:
            print(f"  - {port.device}: {port.description}")

        # Try to find likely ESP32 port (USB Serial Device)
        for port in ports:
            if 'USB' in port.description or 'UART' in port.description:
                print(f"Auto-detected: {port.device}")
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
        """Validate incoming telemetry data structure"""
        required_fields = ['packet_id', 'current', 'rssi', 'snr']
        for field in required_fields:
            if field not in data:
                print(f"Validation error: Missing field '{field}'")
                return False

        # Validate data types
        try:
            int(data['packet_id'])
            float(data['current'])
            int(data['rssi'])
            float(data['snr'])
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

            # Prepare CSV row
            timestamp = datetime.now(timezone.utc).isoformat()
            csv_row = f"{self.session_id},{data['packet_id']},{data['current']},{data['rssi']},{data['snr']},{timestamp}\n"

            # Append to CSV file
            with open(self.csv_file, 'a') as f:
                f.write(csv_row)

            print(f"[{datetime.now().strftime('%H:%M:%S')}] Logged packet {data['packet_id']} to {self.csv_file}")

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
        except Exception as e:
            print(f"Error processing telemetry: {e}")

    def initialize_csv(self):
        """Create CSV file with header"""
        header = "session_id,packet_id,current,rssi,snr,timestamp\n"
        with open(self.csv_file, 'w') as f:
            f.write(header)
        print(f"Initialized CSV file: {self.csv_file}")

    def run(self):
        """Main loop with reconnect logic"""
        print(f"Session ID: {self.session_id}")
        print(f"CSV Output: {self.csv_file}")
        print("Listening for telemetry data...")
        print("Press Ctrl+C to stop")

        # Initialize CSV file
        self.initialize_csv()

        while self.running:
            if not self.connect_serial():
                print("Retrying in 5 seconds...")
                import time
                time.sleep(5)
                continue

            try:
                while self.running:
                    if self.serial_conn.in_waiting > 0:
                        line = self.serial_conn.readline().decode('utf-8', errors='ignore')
                        if line.strip():
                            self.process_telemetry(line)

            except serial.SerialException as e:
                print(f"Serial connection lost: {e}")
                if self.serial_conn:
                    self.serial_conn.close()
                print("Reconnecting in 5 seconds...")
                import time
                time.sleep(5)

            except KeyboardInterrupt:
                print("\nShutting down...")
                self.running = False

        finally:
            if self.serial_conn:
                self.serial_conn.close()
            print(f"Session complete. Data saved to: {self.csv_file}")

def main():
    parser = argparse.ArgumentParser(description='Offline field telemetry logger')
    parser.add_argument('--port', type=str, help='Serial port (e.g., COM3 or /dev/ttyUSB0)')
    args = parser.parse_args()

    logger = OfflineTelemetryLogger(args.port)
    logger.run()

if __name__ == "__main__":
    main()
