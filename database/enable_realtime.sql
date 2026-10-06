-- ============================================================================
-- ENABLE SUPABASE REALTIME FOR TELEMETRY_LOGS TABLE
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable Realtime for telemetry_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_logs;

-- Verify the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- If you get an error saying the table is already in the publication, that's fine - it means it's already enabled
