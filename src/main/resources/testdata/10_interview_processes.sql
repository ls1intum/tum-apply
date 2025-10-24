-- ===========================================================
-- 10_interview_processes.sql
-- Inserts example interview processes for test jobs
-- Preconditions:
--   - Jobs must already exist (from 04_jobs.sql)
-- ===========================================================

-- Compatibility and best-practice headers (Codacy friendly)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Clean up existing interview_processes (for consistent seeding)
DELETE FROM interview_processes
WHERE id LIKE '00000000-0000-0000-0000-000000030%';

-- Insert example interview_processes (linked to existing jobs)
INSERT INTO interview_processes (id, job_id, created_at, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000030001', '00000000-0000-0000-0000-000000020001', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),
  ('00000000-0000-0000-0000-000000030002', '00000000-0000-0000-0000-000000020005', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),
  ('00000000-0000-0000-0000-000000030003', '00000000-0000-0000-0000-000000020006', '2025-01-15 09:00:00', '2025-01-15 09:00:00')
  ON DUPLICATE KEY UPDATE
                     job_id = VALUES(job_id),
                     last_modified_at = VALUES(last_modified_at);
