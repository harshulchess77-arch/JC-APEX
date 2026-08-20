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

-- Telemetry logs table
CREATE TABLE telemetry_logs (
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

-- Create indexes for better query performance
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_number ON drivers(number);
CREATE INDEX idx_vehicle_configs_driver_id ON vehicle_configs(driver_id);
CREATE INDEX idx_telemetry_logs_race_id ON telemetry_logs(race_id);
CREATE INDEX idx_telemetry_logs_driver_id ON telemetry_logs(driver_id);
CREATE INDEX idx_telemetry_logs_timestamp ON telemetry_logs(timestamp);
CREATE INDEX idx_incident_reports_race_id ON incident_reports(race_id);
CREATE INDEX idx_incident_reports_driver_id ON incident_reports(driver_id);

-- Enable Row Level Security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
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

-- Telemetry logs policies
CREATE POLICY "Telemetry logs are publicly viewable" ON telemetry_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert telemetry logs" ON telemetry_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update telemetry logs" ON telemetry_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete telemetry logs" ON telemetry_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Incident reports policies
CREATE POLICY "Incident reports are publicly viewable" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert incident reports" ON incident_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update incident reports" ON incident_reports FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete incident reports" ON incident_reports FOR DELETE USING (auth.role() = 'authenticated');

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
