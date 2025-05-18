-- =============================================
-- 04_jobs.sql
-- Inserts example jobs
-- Preconditions:
--   - Users (professors) must already exist
--   - postedBy references users.user_id (professor)
-- =============================================

-- Clean up existing jobs
DELETE
FROM jobs
WHERE job_id IN ('00000000-0000-0000-0000-000000010001',
                 '00000000-0000-0000-0000-000000010002',
                 '00000000-0000-0000-0000-000000010003',
                 '00000000-0000-0000-0000-000000010004',
                 '00000000-0000-0000-0000-000000010005');

-- Insert example jobs
REPLACE INTO jobs (job_id,
                   professor_id,
                   research_group_id,
                   field_of_studies,
                   research_area,
                   location,
                   workload,
                   contract_duration,
                   funding_type,
                   title,
                   description,
                   tasks,
                   requirements,
                   state,
                   start_date)
VALUES
-- Job 1 (Fully filled out, normal case)
('00000000-0000-0000-0000-000000010001',
 '00000000-0000-0000-0000-000000000102',
 '00000000-0000-0000-0000-000000000001',
 'Computer Science',
 'Artificial Intelligence',
 'GARCHING',
 20,
 2,
 'GOVERNMENT_FUNDED',
 'Research Assistant in AI',
 'Join our AI research group to explore innovative technologies.',
 'Assist in AI research projects, publish papers, collaborate with partners.',
 'Bachelor in Computer Science or related field, experience with ML.',
 'PUBLISHED',
 '2025-10-01'),

-- Job 2 (Some NULLs: no description or requirements)
('00000000-0000-0000-0000-000000010002',
 '00000000-0000-0000-0000-000000000105',
 '00000000-0000-0000-0000-000000000002',
 'Mechanical Engineering',
 'Robotics',
 'SINGAPORE',
 40,
 1,
 'RESEARCH_GRANT',
 'Researcher in Robotics',
 NULL,
 'Design robotic systems, prototype mechanical solutions, publish research.',
 NULL,
 'DRAFT',
 '2025-10-01'),

-- Job 3 (All NULLs except the mandatory ones)
('00000000-0000-0000-0000-000000010003',
 '00000000-0000-0000-0000-000000000105',
 '00000000-0000-0000-0000-000000000001',
 NULL,
 NULL,
 'HEILBRONN',
 NULL,
 NULL,
 'INDUSTRY_SPONSORED',
 NULL,
 NULL,
 NULL,
 NULL,
 'DRAFT',
 NULL),

-- Job 4 (Some NULLs: no description or tasks)
('00000000-0000-0000-0000-000000010004',
 '00000000-0000-0000-0000-000000000102',
 '00000000-0000-0000-0000-000000000002',
 'Informatics',
 'Human-Computer Interaction',
 'STRAUBING',
 20,
 6,
 'SCHOLARSHIP',
 'Student Assistant in UX Research',
 NULL,
 NULL,
 'Ongoing Bachelor in Informatics or related, enthusiasm for UX.',
 'DRAFT',
 '2025-10-01'),

-- Job 5 (Fully filled out again, normal)
('00000000-0000-0000-0000-000000010005',
 '00000000-0000-0000-0000-000000000105',
 '00000000-0000-0000-0000-000000000002',
 'Information Systems',
 'Data Science',
 'GARCHING_HOCHBRUECK',
 40,
 6,
 'FULLY_FUNDED',
 'PhD Position: Big Data Analytics',
 'Work on cutting-edge Big Data applications in health and finance sectors.',
 'Develop data pipelines, analyze massive datasets, publish results.',
 'Master in Computer Science or Data Science, SQL and Python skills.',
 'APPLICANT_FOUND',
 '2025-10-01'),
 
 -- Job 6 (Fully filled out again, normal, no user has applied to this one yet)
('00000000-0000-0000-0000-000000010006',
 '00000000-0000-0000-0000-000000000102',
 '00000000-0000-0000-0000-000000000001',
 'Computer Engineering',
 'Edge Computing',
 'MUNICH',
 20,
 3,
 'GOVERNMENT_FUNDED',
 'Research Assistant: Edge AI',
 'Conduct experiments on edge AI models and low-power devices.',
 'Design systems, collect data, implement ML models, publish outcomes.',
 'Bachelor in CS/CE, experience with embedded systems and TensorFlow Lite.',
 'PUBLISHED',
 '2025-11-01');
