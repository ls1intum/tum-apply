-- ===========================================================
-- 12_interview_scenario.sql
-- Scenario: Invites 'applicant1' (Max Applicant) to an interview process and adds slots.
-- Prerequisites: Run 01_users.sql, 10_interview_processes.sql, 07_applications.sql
-- ===========================================================

-- 1. Create Slots for existing Process 30001 (Linked to Job 20001)
-- Dates: Tomorrow at 10:00 (Virtual) and 14:00 (In-Person)
INSERT INTO interview_slots (id, start_date_time, end_date_time, interview_process_id, location, created_at)
VALUES
('00000000-0000-0000-0000-000000099001', TIMESTAMPADD('DAY', 1, CURRENT_DATE) + INTERVAL '10' HOUR, TIMESTAMPADD('DAY', 1, CURRENT_DATE) + INTERVAL '11' HOUR, '00000000-0000-0000-0000-000000030001', 'virtual', NOW()),
('00000000-0000-0000-0000-000000099002', TIMESTAMPADD('DAY', 1, CURRENT_DATE) + INTERVAL '14' HOUR, TIMESTAMPADD('DAY', 1, CURRENT_DATE) + INTERVAL '15' HOUR, '00000000-0000-0000-0000-000000030001', 'in-person', NOW());

-- 2. Invite applicant1 to Process 30001
-- Uses existing Application 300000020002 (Applicant 1 -> Job 20001)
INSERT INTO interviewees (id, interview_process_id, application_id, last_invited, created_at)
VALUES
('00000000-0000-0000-0000-000000099100', '00000000-0000-0000-0000-000000030001', '00000000-0000-0000-0000-300000020002', NOW(), NOW());

)
