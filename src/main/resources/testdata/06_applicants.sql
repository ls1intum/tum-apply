-- =============================================
-- 06_applicants.sql
-- Inserts example applicants
-- Preconditions:
--   - users must exist
-- =============================================

-- clean existing data
DELETE
FROM applicants
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000106'
);

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
    'ONE_TO_FOUR',
    NULL,
    NULL,
    NULL,
    'ONE_TO_FOUR',
    NULL,
    NULL
),
(
    '00000000-0000-0000-0000-000000000106',
    '123 Main St',
    '94105',
    'San Francisco',
    'USA',
    'B.Sc. Computer Science',
    'ONE_TO_FOUR',
    '3.5',
    'University of California, Berkeley',
    'M.Sc. Artificial Intelligence',
    'ONE_TO_FOUR',
    '2.7',
    'Stanford University'
);
