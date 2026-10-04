"""
Hardware Simulator - Mock ESP32 Receiver
Simulates ESP32 Receiver output over USB Serial for testing gateway scripts without physical hardware

Generates realistic JSON telemetry payloads at 5 Hz:
- Current: 0.5A to 18.0A with realistic fluctuations
- Packet ID: Incrementing
- RSSI: Around -65 dBm with noise
- SNR: Around 9.0 dB with noise

Usage:
- python mock_simulator.py                    # Output to console
- python mock_simulator.py --port COM3       # Output to virtual serial port (requires pyserial)
"""

import json
import time
import argparse
import random
import math
from datetime import datetime, timezone

class HardwareSimulator:
    def __init__(self, output_port=None):
        self.output_port = output_port
        self.packet_id = 0
        self.base_current = 10.0  # Base current in Amps
        self.running = True

    def generate_telemetry(self):
        """Generate realistic telemetry data"""
        # Simulate current with realistic fluctuations (0.5A to 18.0A)
        # Use sine wave + random noise for realistic motor current pattern
        time_factor = time.time() % 10  # 10-second cycle
        sine_component = math.sin(time_factor * 2 * math.pi / 10) * 7.5  # +/- 7.5A
        noise = random.gauss(0, 0.5)  # Gaussian noise
        current = max(0.5, min(18.0, self.base_current + sine_component + noise))

        # RSSI around -65 dBm with noise
        rssi = int(-65 + random.gauss(0, 3))

        # SNR around 9.0 dB with noise
        snr = round(9.0 + random.gauss(0, 1.5), 1)

        telemetry = {
            "packet_id": self.packet_id,
            "current": round(current, 2),
            "rssi": rssi,
            "snr": snr
        }

        self.packet_id += 1
        return telemetry

    def run_console(self):
        """Output telemetry to console (stdout)"""
        print(f"=== Hardware Simulator Started ===")
        print(f"Output: Console (stdout)")
        print(f"Rate: 5 Hz (200ms interval)")
        print(f"Press Ctrl+C to stop")
        print()

        try:
            while self.running:
                telemetry = self.generate_telemetry()
                print(json.dumps(telemetry), flush=True)
                time.sleep(0.2)  # 5 Hz = 200ms

        except KeyboardInterrupt:
            print("\nSimulator stopped")

    def run_serial(self, port):
        """Output telemetry to virtual serial port"""
        try:
            import serial
        except ImportError:
            print("ERROR: pyserial not installed. Install with: pip install pyserial")
            return

        try:
            ser = serial.Serial(port, 115200, timeout=1)
            print(f"=== Hardware Simulator Started ===")
            print(f"Output: Serial port {port} at 115200 baud")
            print(f"Rate: 5 Hz (200ms interval)")
            print(f"Press Ctrl+C to stop")
            print()

            try:
                while self.running:
                    telemetry = self.generate_telemetry()
                    line = json.dumps(telemetry) + "\n"
                    ser.write(line.encode('utf-8'))
                    time.sleep(0.2)  # 5 Hz = 200ms

            except KeyboardInterrupt:
                print("\nSimulator stopped")
            finally:
                ser.close()

        except serial.SerialException as e:
            print(f"ERROR: Failed to open serial port {port}: {e}")
            print("Tip: Use virtual serial port software (com0com, socat) to create test ports")

def main():
    parser = argparse.ArgumentParser(description='Hardware simulator for ESP32 Receiver')
    parser.add_argument('--port', type=str, help='Serial port (e.g., COM3 or /dev/ttyUSB0)')
    args = parser.parse_args()

    simulator = HardwareSimulator(args.port)

    if args.port:
        simulator.run_serial(args.port)
    else:
        simulator.run_console()

if __name__ == "__main__":
    main()
