-- =============================================
-- 05_custom_fields.sql
-- Inserts example custom fields
-- Preconditions:
--   - Jobs must already exist
-- =============================================

-- Clean up existing custom fields
DELETE
FROM custom_fields
WHERE custom_field_id IN ('00000000-0000-0000-0000-000000020001',
                          '00000000-0000-0000-0000-000000020002',
                          '00000000-0000-0000-0000-000000020003',
                          '00000000-0000-0000-0000-000000020004');

-- Insert example custom fields
REPLACE INTO custom_fields (custom_field_id,
                             job_id,
                             question,
                             is_required,
                             custom_field_type,
                             answer_options,
                             sequence)
VALUES
-- For Job 00000000-0000-0000-0000-000000020001 (Deep Learning)
('00000000-0000-0000-0000-000000020001',
 '00000000-0000-0000-0000-000000020001',
 'Which programming languages do you know?',
 TRUE,
 'FREE_TEXT',
 NULL,
 1),

('00000000-0000-0000-0000-000000020002',
 '00000000-0000-0000-0000-000000020001',
 'Upload your latest research paper',
 FALSE,
 'FILE_UPLOAD',
 NULL,
 2),

-- For Job 00000000-0000-0000-0000-000000020002 (Algorithms)
('00000000-0000-0000-0000-000000020003',
 '00000000-0000-0000-0000-000000020002',
 'Select your preferred work location',
 TRUE,
 'SINGLE_CHOICE',
 '["Munich", "Garching", "Remote"]',
 3),

-- For Job 00000000-0000-0000-0000-000000020004 (Radar Systems)
('00000000-0000-0000-0000-000000020004',
 '00000000-0000-0000-0000-000000020004',
 'How many years of experience do you have in AI?',
 FALSE,
 'MULTIPLE_CHOICE',
 '["less than 1 year", "1 - 2 years", "more than 3 years"]',
 4);
