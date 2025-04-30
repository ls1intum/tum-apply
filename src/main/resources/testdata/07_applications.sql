-- =============================================
-- 07_applications.sql
-- Inserts example applications
-- Preconditions:
--   - applicants must exists
-- =============================================


-- clean existing data
DELETE
FROM applications
WHERE application_id IN ('1c982d01-4560-437a-92d8-310aacb5991c',
                  'd6c49666-2392-4184-ba12-2a0074b2d138',
                  '2438c612-6045-408c-8528-af4e99a52859',
                  '2a18ee8b-9f8d-4369-89fd-7d4768845efa',
                  '6365bb47-38f9-4d79-9c3a-4f1c094d413c',
                  '4c05bf7d-f06c-44da-982b-7760fa49771c',
                  'db7fdef7-37f6-474b-a646-9068da9135ca',
                  'f7ec007f-fba0-4135-b88c-c70eec79faf3',
                  'bce85235-25b7-46c2-988c-9290be79dc57',
                  'cafc966e-1927-4593-bd36-986e8f06db25');

-- insert test data
REPLACE INTO applications (application_id, applicant_id, job_id, application_state, desired_start_date, motivation, rating, created_at, last_modified_at)
VALUES
('1c982d01-4560-437a-92d8-310aacb5991c', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000010001', 'SAVED', '2025-07-01', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', -2, '2025-03-30 00:00:00', '2025-03-30 00:00:00'),

('d6c49666-2392-4184-ba12-2a0074b2d138', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000010002', 'WITHDRAWN', '2025-09-12', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', 0, '2025-04-12 00:00:00', '2025-04-12 00:00:00'),

('2438c612-6045-408c-8528-af4e99a52859', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000010003', 'ACCEPTED', '2025-12-01', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', null, '2025-03-30 00:00:00', '2025-03-30 00:00:00'),

('2a18ee8b-9f8d-4369-89fd-7d4768845efa', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000010004', 'REJECTED', '2025-07-27', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', 2, '2025-03-05 00:00:00', '2025-03-05 00:00:00'),

('6365bb47-38f9-4d79-9c3a-4f1c094d413c', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000010005', 'IN_REVIEW', '2025-07-08', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', null, '2025-04-25 00:00:00', '2025-04-25 00:00:00'),

('4c05bf7d-f06c-44da-982b-7760fa49771c', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000010001', 'IN_REVIEW', '2025-09-01', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', 1, '2025-03-03 00:00:00', '2025-03-03 00:00:00'),

('db7fdef7-37f6-474b-a646-9068da9135ca', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000010002', 'SENT', '2025-09-10', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', 0, '2025-04-08 00:00:00', '2025-04-08 00:00:00'),

('f7ec007f-fba0-4135-b88c-c70eec79faf3', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000010003', 'ACCEPTED', '2025-08-05', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', null, '2025-04-18 00:00:00', '2025-04-18 00:00:00'),

('bce85235-25b7-46c2-988c-9290be79dc57', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000010004', 'SAVED', '2025-06-11', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', 1, '2025-04-27 00:00:00', '2025-04-27 00:00:00'),

('cafc966e-1927-4593-bd36-986e8f06db25', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000010005', 'SENT', '2025-07-22', 'Ever since I built my first robot in high school, I knew I wanted to pursue intelligent systems.', -1, '2025-04-08 00:00:00', '2025-04-08 00:00:00');

