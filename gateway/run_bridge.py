#!/usr/bin/env python3
"""
JC-APEX Bridge Auto-Restart Runner
Monitors bridge_online.py and automatically restarts on crash with exponential backoff.
"""

import subprocess
import time
import sys
import os

def run_bridge():
    max_retries = 10
    retry_delay = 5  # Initial delay in seconds
    
    while max_retries > 0:
        print(f"[RUNNER] Starting bridge_online.py (attempts remaining: {max_retries})...")
        try:
            # Run the bridge script
            process = subprocess.Popen(
                [sys.executable, "bridge_online.py"],
                cwd=os.path.dirname(os.path.abspath(__file__)),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for process to complete
            process.wait()
            
            if process.returncode == 0:
                print("[RUNNER] Bridge exited normally. Stopping.")
                return
            else:
                print(f"[RUNNER] Bridge crashed with code {process.returncode}. Restarting in {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60)  # Exponential backoff, max 60s
                max_retries -= 1
                
        except KeyboardInterrupt:
            print("\n[RUNNER] Interrupted by user. Stopping.")
            if process.poll() is None:
                process.terminate()
            return
        except Exception as e:
            print(f"[RUNNER] Error: {e}. Restarting in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 60)
            max_retries -= 1
    
    print("[RUNNER] Max retries reached. Giving up.")

if __name__ == "__main__":
    run_bridge()
