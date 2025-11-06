-- ===========================================================
-- 10_interview_processes.sql
-- Inserts example interview processes for professor1@tumapply.local
-- (professor_id: 00000000-0000-0000-0000-000000000102)
-- Preconditions:
--   - Jobs must already exist (from 04_jobs.sql)
-- ===========================================================

-- Clean up existing entries (for consistent seeding)
DELETE
FROM interview_processes
WHERE id LIKE '00000000-0000-0000-0000-000000030%';

-- Insert example interview processes linked to existing jobs
INSERT INTO interview_processes (id, job_id, created_at, last_modified_at)
VALUES
  -- Job 20001: Gamification in Education Intern (PUBLISHED)
  ('00000000-0000-0000-0000-000000030001',
   '00000000-0000-0000-0000-000000020001',
   '2025-01-15 09:00:00',
   '2025-01-15 09:00:00'),

  -- Job 20002: Learning Analytics Researcher (DRAFT)
  ('00000000-0000-0000-0000-000000030002',
   '00000000-0000-0000-0000-000000020002',
   '2025-02-10 11:00:00',
   '2025-02-10 11:00:00'),

  -- Job 20005: Automated Grading Researcher (APPLICANT_FOUND)
  ('00000000-0000-0000-0000-000000030003',
   '00000000-0000-0000-0000-000000020005',
   '2025-01-15 09:00:00',
   '2025-01-15 09:00:00');
