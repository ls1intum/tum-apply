-- ===========================================================
-- 11_interview_slots.sql
-- Resets all interview_slots for consistent seeding
-- ===========================================================

-- 🧹 Delete ALL interview slots (clean slate)
DELETE FROM interview_slots;

-- 🔄 Re-insert example interview slots

-- ======================================================
-- Slots for Process 00000000-0000-0000-0000-000000030001
-- ======================================================

-- 📅 2025-11-20 (Wednesday) - 3 slots
INSERT INTO interview_slots (id, interview_process_id, start_date_time, end_date_time, location, stream_link, is_booked, created_by, created_at, last_modified_by, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000040001', '00000000-0000-0000-0000-000000030001', '2025-11-20 08:00:00', '2025-11-20 08:45:00', 'Room MI 01.11.018', NULL, TRUE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00'),
  ('00000000-0000-0000-0000-000000040002', '00000000-0000-0000-0000-000000030001', '2025-11-20 09:00:00', '2025-11-20 09:45:00', 'Room MI 01.11.018', NULL, FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00'),
  ('00000000-0000-0000-0000-000000040003', '00000000-0000-0000-0000-000000030001', '2025-11-20 13:00:00', '2025-11-20 13:45:00', 'virtual', 'https://zoom.us/j/123456789', FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00');

-- 📅 2025-11-21 (Thursday) - 2 slots
INSERT INTO interview_slots (id, interview_process_id, start_date_time, end_date_time, location, stream_link, is_booked, created_by, created_at, last_modified_by, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000040004', '00000000-0000-0000-0000-000000030001', '2025-11-21 08:00:00', '2025-11-21 08:45:00', 'Room MI 01.11.018', NULL, FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00'),
  ('00000000-0000-0000-0000-000000040005', '00000000-0000-0000-0000-000000030001', '2025-11-21 10:00:00', '2025-11-21 10:45:00', 'virtual', 'https://meet.google.com/abc-defg-hij', FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00');

-- 📅 2025-11-22 (Friday) - 2 slots
INSERT INTO interview_slots (id, interview_process_id, start_date_time, end_date_time, location, stream_link, is_booked, created_by, created_at, last_modified_by, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000040006', '00000000-0000-0000-0000-000000030001', '2025-11-22 12:00:00', '2025-11-22 12:45:00', 'Room MI 02.13.010', NULL, FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00'),
  ('00000000-0000-0000-0000-000000040007', '00000000-0000-0000-0000-000000030001', '2025-11-22 14:00:00', '2025-11-22 14:45:00', 'virtual', 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc123', FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00');

-- 📅 2025-11-25 (Monday) - 1 slot
INSERT INTO interview_slots (id, interview_process_id, start_date_time, end_date_time, location, stream_link, is_booked, created_by, created_at, last_modified_by, last_modified_at)
VALUES
  ('00000000-0000-0000-0000-000000040008', '00000000-0000-0000-0000-000000030001', '2025-11-25 09:00:00', '2025-11-25 09:45:00', 'Room MI 01.11.018', NULL, FALSE, 'system', '2025-11-10 10:00:00', 'system', '2025-11-10 10:00:00');
