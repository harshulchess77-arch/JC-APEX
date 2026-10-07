"""
Post-Field Data Sync - CSV to Supabase
Reads offline CSV session data and bulk inserts to Supabase when internet is restored

Requirements:
- pip install requests python-dotenv

Usage:
- python sync_offline_data.py --file session_20261004_150000.csv
"""

import csv
import os
import sys
import argparse
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DataSync:
    def __init__(self, csv_file: str):
        self.csv_file = csv_file
        self.supabase_url = os.getenv('SUPABASE_URL')
        # Prefer service role key for admin operations, fall back to anon key
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY')

        if not self.supabase_url or not self.supabase_key:
            print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in .env file")
            sys.exit(1)

        # Build Supabase REST endpoint URL
        self.rest_url = f"{self.supabase_url}/rest/v1/telemetry_logs"
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }

    def read_csv(self):
        """Read CSV file and return list of records"""
        records = []

        try:
            with open(self.csv_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(row)

            print(f"Read {len(records)} records from {self.csv_file}")
            return records

        except FileNotFoundError:
            print(f"ERROR: File not found: {self.csv_file}")
            sys.exit(1)
        except Exception as e:
            print(f"ERROR: Failed to read CSV: {e}")
            sys.exit(1)

    def validate_record(self, record: dict) -> bool:
        """Validate a single record with flexible column mapping"""
        # Support both new and legacy CSV column names
        id_field = record.get('id') or record.get('packet_id')
        amps_field = record.get('amps') or record.get('current')
        volts_field = record.get('volts') or record.get('voltage')
        rssi = record.get('rssi')
        snr = record.get('snr')
        timestamp = record.get('timestamp')

        if id_field is None or amps_field is None or rssi is None or snr is None or timestamp is None:
            print(f"Validation error: Missing required fields - got {list(record.keys())}")
            return False

        try:
            int(id_field)
            float(amps_field)
            float(volts_field) if volts_field else True
            int(rssi)
            float(snr)
        except (ValueError, TypeError) as e:
            print(f"Validation error: Invalid data type - {e}")
            return False

        return True

    def prepare_payload(self, record: dict) -> dict:
        """Prepare Supabase payload from CSV record with flexible column mapping"""
        return {
            'id': int(record.get('id') or record.get('packet_id', 0)),
            'volts': float(record.get('volts') or record.get('voltage', 0.0)),
            'amps': float(record.get('amps') or record.get('current', 0.0)),
            'watts': float(record.get('watts') or record.get('power', 0.0)),
            'speed_h': float(record.get('speed_h') or record.get('speed_hall', 0.0)),
            'speed_g': float(record.get('speed_g') or record.get('speed_gps', 0.0)),
            'rssi': int(record.get('rssi', -80)),
            'snr': float(record.get('snr', 9.0)),
            'created_at': record.get('timestamp')
        }

    def sync_to_supabase(self, records: list, batch_size: int = 100):
        """Sync records to Supabase in batches with schema fallback"""
        total_records = len(records)
        synced = 0
        failed = 0
        schema_fallback_active = False

        for i in range(0, total_records, batch_size):
            batch = records[i:i + batch_size]
            payloads = [self.prepare_payload(record) for record in batch if self.validate_record(record)]

            try:
                response = requests.post(
                    self.rest_url,
                    json=payloads,
                    headers=self.headers,
                    timeout=30
                )

                if response.status_code in [200, 201]:
                    synced += len(payloads)
                    print(f"Synced batch {i//batch_size + 1}: {len(payloads)} records")
                elif response.status_code == 400 and not schema_fallback_active:
                    print(f"[SCHEMA NOTICE] Database schema missing columns: {response.text}")
                    print("[FALLBACK] Retrying with core telemetry schema...")
                    schema_fallback_active = True
                    # Retry with minimal payload
                    legacy_payloads = [
                        {
                            'id': p['id'],
                            'amps': p['amps'],
                            'rssi': p['rssi'],
                            'snr': p['snr'],
                            'created_at': p['created_at']
                        }
                        for p in payloads
                    ]
                    response = requests.post(
                        self.rest_url,
                        json=legacy_payloads,
                        headers=self.headers,
                        timeout=30
                    )
                    if response.status_code in [200, 201]:
                        synced += len(legacy_payloads)
                        print(f"Synced batch {i//batch_size + 1} (fallback): {len(legacy_payloads)} records")
                    else:
                        failed += len(payloads)
                        print(f"ERROR: Batch {i//batch_size + 1} fallback failed - HTTP {response.status_code}: {response.text}")
                else:
                    failed += len(payloads)
                    print(f"ERROR: Batch {i//batch_size + 1} failed - HTTP {response.status_code}: {response.text}")

            except requests.exceptions.RequestException as e:
                failed += len(payloads)
                print(f"ERROR: Batch {i//batch_size + 1} failed - {e}")

        print(f"\nSync complete:")
        print(f"  Total records: {total_records}")
        print(f"  Successfully synced: {synced}")
        print(f"  Failed: {failed}")

        return synced, failed

    def run(self):
        """Main sync process"""
        print(f"Starting sync for: {self.csv_file}")
        print(f"Target: {self.rest_url}")

        # Test Supabase connection
        try:
            response = requests.get(f"{self.supabase_url}/rest/v1/", headers={'apikey': self.supabase_key}, timeout=5)
            if response.status_code == 200:
                print("✓ Supabase connection verified")
            else:
                print(f"⚠ Supabase connection warning: HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"✗ Supabase connection failed: {e}")
            print("Please check your internet connection and .env configuration")
            sys.exit(1)

        # Read CSV
        records = self.read_csv()

        if not records:
            print("No records to sync")
            return

        # Sync to Supabase
        synced, failed = self.sync_to_supabase(records)

        if failed == 0:
            print(f"\n✓ All records synced successfully!")
            print(f"You can now view the data on your dashboard")
        else:
            print(f"\n⚠ Some records failed to sync. Please check the errors above.")

def main():
    parser = argparse.ArgumentParser(description='Sync offline CSV data to Supabase')
    parser.add_argument('--file', type=str, required=True, help='CSV file to sync')
    args = parser.parse_args()

    sync = DataSync(args.file)
    sync.run()

if __name__ == "__main__":
    main()
