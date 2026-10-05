-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drivers table
CREATE TABLE drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  number TEXT,
  age INTEGER,
  weight_kg NUMERIC,
  experience_years INTEGER,
  wins INTEGER DEFAULT 0,
  podiums INTEGER DEFAULT 0,
  races_entered INTEGER DEFAULT 0,
  best_finish TEXT,
  avg_lap_time TEXT,
  notes TEXT,
  motor_type TEXT,
  battery_capacity TEXT,
  gear_ratio TEXT,
  tire_type TEXT,
  wheel_size TEXT,
  aero_config TEXT DEFAULT 'Stock',
  setup_notes TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle configurations table
CREATE TABLE vehicle_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  race_name TEXT,
  tire_pressure_front TEXT,
  tire_pressure_rear TEXT,
  suspension_front TEXT,
  suspension_rear TEXT,
  gear_ratio TEXT,
  motor_controller TEXT,
  camber_front TEXT,
  camber_rear TEXT,
  ride_height TEXT,
  ballast_position TEXT,
  notes TEXT,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Races table
CREATE TABLE races (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  circuit_name TEXT,
  date DATE,
  total_laps INTEGER DEFAULT 70,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry logs table (race telemetry)
CREATE TABLE race_telemetry_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  speed NUMERIC,
  battery NUMERIC,
  temp NUMERIC,
  voltage NUMERIC,
  current NUMERIC,
  efficiency NUMERIC,
  lap NUMERIC,
  race_time INTEGER
);

-- Incident reports table
CREATE TABLE incident_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  race_id UUID REFERENCES races(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  incident_type TEXT,
  description TEXT,
  severity TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telemetry logs table for real-time hardware data (Electrothon 48V Tractive System)
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    packet_id BIGINT NOT NULL,
    current NUMERIC(8,2) NOT NULL,
    voltage NUMERIC(8,2) DEFAULT 0.00,
    power NUMERIC(8,2) DEFAULT 0.00,
    speed_hall NUMERIC(8,2) DEFAULT 0.00,
    speed_gps NUMERIC(8,2) DEFAULT 0.00,
    latitude NUMERIC(10,6) DEFAULT 0.00,
    longitude NUMERIC(10,6) DEFAULT 0.00,
    rssi NUMERIC(6,2),
    snr NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist for existing databases
ALTER TABLE public.telemetry_logs
ADD COLUMN IF NOT EXISTS voltage NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS power NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS speed_hall NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS speed_gps NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6) DEFAULT 0.00;

-- Index session_id and created_at for fast time-series filtering
CREATE INDEX IF NOT EXISTS idx_telemetry_session_time
ON public.telemetry_logs (session_id, created_at DESC);

-- Create indexes for better query performance
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_number ON drivers(number);
CREATE INDEX idx_vehicle_configs_driver_id ON vehicle_configs(driver_id);
CREATE INDEX idx_race_telemetry_logs_race_id ON race_telemetry_logs(race_id);
CREATE INDEX idx_race_telemetry_logs_driver_id ON race_telemetry_logs(driver_id);
CREATE INDEX idx_race_telemetry_logs_timestamp ON race_telemetry_logs(timestamp);
CREATE INDEX idx_incident_reports_race_id ON incident_reports(race_id);
CREATE INDEX idx_incident_reports_driver_id ON incident_reports(driver_id);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access, authenticated write access

-- Drivers policies
CREATE POLICY "Drivers are publicly viewable" ON drivers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert drivers" ON drivers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update drivers" ON drivers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete drivers" ON drivers FOR DELETE USING (auth.role() = 'authenticated');

-- Vehicle configs policies
CREATE POLICY "Vehicle configs are publicly viewable" ON vehicle_configs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert vehicle configs" ON vehicle_configs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update vehicle configs" ON vehicle_configs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete vehicle configs" ON vehicle_configs FOR DELETE USING (auth.role() = 'authenticated');

-- Races policies
CREATE POLICY "Races are publicly viewable" ON races FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert races" ON races FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update races" ON races FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete races" ON races FOR DELETE USING (auth.role() = 'authenticated');

-- Race telemetry logs policies
DROP POLICY IF EXISTS "Allow anon insert and select" ON race_telemetry_logs;
DROP POLICY IF EXISTS "allow_anon_read" ON race_telemetry_logs;
DROP POLICY IF EXISTS "allow_anon_insert" ON race_telemetry_logs;

CREATE POLICY "allow_anon_read" ON race_telemetry_logs
FOR SELECT
TO anon
USING (true);

CREATE POLICY "allow_anon_insert" ON race_telemetry_logs
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Authenticated users can update race telemetry logs" ON race_telemetry_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete race telemetry logs" ON race_telemetry_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Public telemetry logs policies (for hardware data)
DROP POLICY IF EXISTS "public_allow_anon_read" ON public.telemetry_logs;
DROP POLICY IF EXISTS "public_allow_anon_insert" ON public.telemetry_logs;

CREATE POLICY "public_allow_anon_read" ON public.telemetry_logs
FOR SELECT
TO anon
USING (true);

CREATE POLICY "public_allow_anon_insert" ON public.telemetry_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Incident reports policies
CREATE POLICY "Incident reports are publicly viewable" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert incident reports" ON incident_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update incident reports" ON incident_reports FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete incident reports" ON incident_reports FOR DELETE USING (auth.role() = 'authenticated');

-- Hardware telemetry policies (cleanup - drop if exists from previous migration)
DO $$
BEGIN
  IF to_regclass('public.hardware_telemetry') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Hardware telemetry is publicly viewable' AND polrelid = 'hardware_telemetry'::regclass) THEN
      DROP POLICY "Hardware telemetry is publicly viewable" ON hardware_telemetry;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anon users can insert hardware telemetry' AND polrelid = 'hardware_telemetry'::regclass) THEN
      DROP POLICY "Anon users can insert hardware telemetry" ON hardware_telemetry;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can insert hardware telemetry' AND polrelid = 'hardware_telemetry'::regclass) THEN
      DROP POLICY "Authenticated users can insert hardware telemetry" ON hardware_telemetry;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can update hardware telemetry' AND polrelid = 'hardware_telemetry'::regclass) THEN
      DROP POLICY "Authenticated users can update hardware telemetry" ON hardware_telemetry;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can delete hardware telemetry' AND polrelid = 'hardware_telemetry'::regclass) THEN
      DROP POLICY "Authenticated users can delete hardware telemetry" ON hardware_telemetry;
    END IF;
  END IF;
END $$;

-- Remove hardware_telemetry from realtime publication if it exists
DO $$
BEGIN
  IF to_regclass('public.hardware_telemetry') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hardware_telemetry'
    ) THEN
      ALTER PUBLICATION supabase_realtime DROP TABLE public.hardware_telemetry;
    END IF;
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_configs_updated_at BEFORE UPDATE ON vehicle_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate session metrics for PDF export
CREATE OR REPLACE FUNCTION calculate_session_metrics(session_id_param TEXT)
RETURNS TABLE (
  session_id TEXT,
  total_records BIGINT,
  peak_current NUMERIC,
  avg_current NUMERIC,
  min_current NUMERIC,
  duration_seconds NUMERIC,
  avg_rssi NUMERIC,
  avg_snr NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tl.session_id,
    COUNT(*) as total_records,
    MAX(tl.current) as peak_current,
    AVG(tl.current) as avg_current,
    MIN(tl.current) as min_current,
    EXTRACT(EPOCH FROM (MAX(tl.created_at) - MIN(tl.created_at))) as duration_seconds,
    AVG(tl.rssi) as avg_rssi,
    AVG(tl.snr) as avg_snr
  FROM public.telemetry_logs tl
  WHERE tl.session_id = session_id_param
  GROUP BY tl.session_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime on public.telemetry_logs table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'telemetry_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_logs;
  END IF;
END $$;

-- Cleanup: Drop old hardware_telemetry table if it exists from previous migration
DROP TABLE IF EXISTS hardware_telemetry CASCADE;

-- Cleanup: Drop old telemetry_logs table if it exists from previous migration (renamed to race_telemetry_logs)
DROP TABLE IF EXISTS telemetry_logs CASCADE;
