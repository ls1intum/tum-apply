-- ===========================================================
-- 10_interview_processes.sql
-- Resets all interview_processes for consistent seeding
-- ===========================================================

-- 🧹 Delete ALL interview processes (clean slate)
DELETE FROM interview_processes;

-- 🔄 Re-insert example processes
INSERT INTO interview_processes (id, job_id, created_at, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000030001', '00000000-0000-0000-0000-000000020001', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),
  ('00000000-0000-0000-0000-000000030003', '00000000-0000-0000-0000-000000020005', '2025-01-15 09:00:00', '2025-01-15 09:00:00');
