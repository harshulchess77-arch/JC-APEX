"""
Integration Test: Verify mock_simulator.py output can be processed by bridge_offline.py logic
This tests the data format without requiring actual serial hardware
"""

import json
import subprocess
import time
import sys

def test_simulator_output():
    """Test that mock_simulator produces valid JSON telemetry"""
    print("Testing mock_simulator.py output...")

    # Start simulator
    proc = subprocess.Popen(
        [sys.executable, 'mock_simulator.py'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='ignore'
    )

    # Read a few lines of output
    valid_packets = 0
    expected_fields = ['packet_id', 'current', 'rssi', 'snr']

    try:
        start_time = time.time()
        while time.time() - start_time < 2:  # Run for 2 seconds
            line = proc.stdout.readline()
            if not line:
                break

            line = line.strip()
            if not line or line.startswith('===') or line.startswith('Output:') or line.startswith('Rate:') or line.startswith('Press'):
                continue

            try:
                data = json.loads(line)
                # Validate required fields
                if all(field in data for field in expected_fields):
                    valid_packets += 1
                    print(f"[OK] Valid packet #{valid_packets}: {data}")
                else:
                    print(f"[FAIL] Invalid packet structure: {data}")
            except json.JSONDecodeError as e:
                print(f"[WARN] JSON decode error: {e} - Line: {line}")

    finally:
        proc.terminate()
        proc.wait(timeout=2)

    print(f"\nTest complete: {valid_packets} valid packets received")
    return valid_packets > 0

if __name__ == "__main__":
    success = test_simulator_output()
    sys.exit(0 if success else 1)
