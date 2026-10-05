-- ============================================================================
-- JC-APEX ELECTROTHON 48V TELEMETRY, GPS & MOTOR INTEGRATION MIGRATION
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<your-project-id>/sql
-- ============================================================================

-- 1. Ensure telemetry_logs has all 48V tractive, speed & GPS columns
ALTER TABLE public.telemetry_logs
ADD COLUMN IF NOT EXISTS voltage NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS power NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS speed_hall NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS speed_gps NUMERIC(8,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6) DEFAULT 0.00;

-- 2. Verify RLS permissions for anon read/write
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

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

-- 3. Ensure publication for Supabase Realtime
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

-- 4. Create index on packet_id and session_id for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_telemetry_session_pkt
ON public.telemetry_logs (session_id, packet_id DESC);

-- 5. Updated session metrics calculation function with 48V power and speed
CREATE OR REPLACE FUNCTION calculate_session_metrics(session_id_param TEXT)
RETURNS TABLE (
  session_id TEXT,
  total_records BIGINT,
  peak_current NUMERIC,
  avg_current NUMERIC,
  min_current NUMERIC,
  peak_voltage NUMERIC,
  avg_voltage NUMERIC,
  peak_power NUMERIC,
  avg_power NUMERIC,
  peak_speed NUMERIC,
  avg_speed NUMERIC,
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
    MAX(tl.voltage) as peak_voltage,
    AVG(tl.voltage) as avg_voltage,
    MAX(tl.power) as peak_power,
    AVG(tl.power) as avg_power,
    MAX(GREATEST(tl.speed_hall, tl.speed_gps)) as peak_speed,
    AVG(GREATEST(tl.speed_hall, tl.speed_gps)) as avg_speed,
    EXTRACT(EPOCH FROM (MAX(tl.created_at) - MIN(tl.created_at))) as duration_seconds,
    AVG(tl.rssi) as avg_rssi,
    AVG(tl.snr) as avg_snr
  FROM public.telemetry_logs tl
  WHERE tl.session_id = session_id_param
  GROUP BY tl.session_id;
END;
$$ LANGUAGE plpgsql;
