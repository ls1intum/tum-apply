-- =============================================
-- 07_applications.sql
-- Inserts example applications
-- Preconditions:
--   - applicants must exists
-- =============================================


-- clean existing data
DELETE
FROM applications;

-- insert test data
REPLACE INTO applications (application_id, applicant_id, job_id, application_state, desired_start_date, motivation, rating)
VALUES
  ('a1c1d1f1-1111-1111-1111-000000000001', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000020001', 'SENT', '2025-09-01', 'I am passionate about machine learning and neural networks.', 2),
  ('a1c1d1f1-1111-1111-1111-000000000002', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000020005', 'IN_REVIEW', '2025-10-01', 'Genetics research aligns with my academic path.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000003', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020002', 'ACCEPTED', '2025-10-15', 'Interested in theoretical CS and optimization.', 3),
  ('a1c1d1f1-1111-1111-1111-000000000004', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020010', 'SAVED', '2025-08-15', 'Human-AI interaction is the future of technology.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000005', '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000020012', 'REJECTED', '2025-09-10', 'Cryptography and security are key research interests.', 1),
  ('a1c1d1f1-1111-1111-1111-000000000006', '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000020022', 'IN_REVIEW', '2025-11-01', 'Bridge monitoring systems are part of my civil engineering work.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000007', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000020013', 'SENT', '2025-08-01', 'Fusion energy has always fascinated me.', 2),
  ('a1c1d1f1-1111-1111-1111-000000000008', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000020027', 'SENT', '2025-09-01', 'Biomedical robotics fits my background.', 1),
  ('a1c1d1f1-1111-1111-1111-000000000009', '11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000020009', 'IN_REVIEW', '2025-09-15', 'AR technologies can change education.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000010', '11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000020025', 'SAVED', '2025-09-01', 'Hypersonic research is in my career plans.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000011', '11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000020045', 'ACCEPTED', '2025-11-10', 'Microplastics analysis is a vital topic today.', 3),
  ('a1c1d1f1-1111-1111-1111-000000000012', '11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000020045', 'IN_REVIEW', '2025-10-15', 'AI in education is where I want to contribute.', 1),
  ('a1c1d1f1-1111-1111-1111-000000000013', '11111111-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000020036', 'SENT', '2025-10-01', 'XAI systems are critical for public trust.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000014', '11111111-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000020017', 'REJECTED', '2025-09-01', 'Green cities and infrastructure align with my values.', 0),
  ('a1c1d1f1-1111-1111-1111-000000000015', '11111111-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000020038', 'SENT', '2025-08-01', 'I’m interested in gamification and education.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000016', '11111111-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000020011', 'IN_REVIEW', '2025-09-10', 'HCI and AI are central to my thesis.', 1),
  ('a1c1d1f1-1111-1111-1111-000000000017', '11111111-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000020031', 'ACCEPTED', '2025-10-01', 'CFD simulations are what I have studied most.', 2),
  ('a1c1d1f1-1111-1111-1111-000000000018', '11111111-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000020035', 'IN_REVIEW', '2025-09-01', 'Seismic research and analytics interest me.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000019', '11111111-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000020038', 'SAVED', '2025-09-15', 'Bayesian modeling and statistics is my field.', NULL),
  ('a1c1d1f1-1111-1111-1111-000000000020', '11111111-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000020036', 'REJECTED', '2025-10-01', 'Climate law and policy is the focus of my current research.', 0),
  ('d7bb4218-e813-41d2-8e91-29541a670682', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000020032', 'ACCEPTED', '2025-09-14', 'I am excited about contributing to cutting-edge research.', 0),
  ('6d483da2-3043-4940-a47b-81d4f0cf469f', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000020015', 'WITHDRAWN', '2025-11-18', 'This position aligns perfectly with my academic background.', 0),
  ('fc5d23e1-dd90-4101-b3e8-a3dabc85bd12', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000020009', 'ACCEPTED', '2025-11-20', 'The topic matches my thesis focus and long-term goals.', 1),
  ('3b5d2218-a666-42e0-917e-8f1b74834539', '11111111-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000020035', 'ACCEPTED', '2025-07-04', 'This opportunity allows me to grow and contribute meaningfully.', -1),
  ('b7a532d2-37d7-4746-8005-f0ec9d410693', '11111111-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000020041', 'SAVED', '2025-10-08', 'This position aligns perfectly with my academic background.', -1),
  ('d394880d-6f76-443f-a55c-d6122440641a', '11111111-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000020017', 'ACCEPTED', '2025-07-24', 'This opportunity allows me to grow and contribute meaningfully.', 3),
  ('6d6f519f-e1a5-4917-ab2d-435f9dd9f6c5', '11111111-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000020033', 'SAVED', '2025-09-04', 'This opportunity allows me to grow and contribute meaningfully.', 1),
  ('592b5f21-24de-4519-bb49-3d53e65e8b62', '11111111-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000020029', 'ACCEPTED', '2025-11-22', 'I am eager to apply my skills in a practical environment.', -1),
  ('bd8088ed-db23-4b90-b366-6ee4aa3630e0', '11111111-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000020004', 'IN_REVIEW', '2025-08-03', 'This opportunity allows me to grow and contribute meaningfully.', 3),
  ('bc714f0d-b1a2-41fc-8ce8-99e421e7f5c7', '11111111-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000020020', 'JOB_CLOSED', '2025-10-10', 'This opportunity allows me to grow and contribute meaningfully.', 0);
