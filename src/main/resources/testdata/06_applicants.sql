-- =============================================
-- 06_applicants.sql
-- Inserts example applicants
-- Preconditions:
--   - users must exist
-- =============================================

-- clean existing data
DELETE
FROM applicants
WHERE user_id IN ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000104');

-- Insert test applicants linked to existing users
REPLACE INTO applicants (
    user_id,
    street,
    postal_code,
    city,
    country,
    bachelor_degree_name,
    bachelor_grading_scale,
    bachelor_grade,
    bachelor_university,
    master_degree_name,
    master_grading_scale,
    master_grade,
    master_university
) VALUES
(
    '00000000-0000-0000-0000-000000000103',
    'Technikerstraße 21A',
    '80333',
    'Munich',
    'Germany',
    'B.Sc. Computer Science',
    'ONE_TO_FOUR',
    '1.7',
    'Technical University of Munich',
    'M.Sc. Robotics, Cognition, Intelligence',
    'ONE_TO_FOUR',
    '1.3',
    'Technical University of Munich'
),
(
    '00000000-0000-0000-0000-000000000104',
    'Leopoldstraße 44',
    '80802',
    'Munich',
    'Germany',
    'B.Sc. Electrical Engineering',
    'ONE_TO_FOUR',
    '2.0',
    'Ludwig Maximilian University',
    'M.Sc. Embedded Systems',
    'ONE_TO_FOUR',
    '1.5',
    'Technical University of Munich'
),
(
    '00000000-0000-0000-0000-000000000103',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);
