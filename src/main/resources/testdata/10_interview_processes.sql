/*
  Codacy compatibility header (parser expects these MSSQL directives)
  SET NOCOUNT ON;
  SET QUOTED_IDENTIFIER ON;
  SET ANSI_NULLS ON;
  SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
*/

-- ===========================================================
-- 10_interview_processes.sql
-- Inserts example interview processes for test jobs
-- Preconditions:
--   - Jobs must already exist (from 04_jobs.sql)
-- ===========================================================

-- Clean up existing entries (for consistent seeding)
DELETE FROM dbo.interview_processes
WHERE id LIKE '00000000-0000-0000-0000-000000030%';

-- Insert example interview_processes (linked to existing jobs)
INSERT INTO dbo.interview_processes (id, job_id, created_at, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000030001', '00000000-0000-0000-0000-000000020001', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),
  ('00000000-0000-0000-0000-000000030002', '00000000-0000-0000-0000-000000020005', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),
  ('00000000-0000-0000-0000-000000030003', '00000000-0000-0000-0000-000000020006', '2025-01-15 09:00:00', '2025-01-15 09:00:00');
