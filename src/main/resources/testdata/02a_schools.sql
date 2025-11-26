-- =============================================
-- 02a_schools.sql
-- Inserts example schools
-- =============================================

-- Clean up
DELETE FROM schools
WHERE
    school_id LIKE '00000000-0000-0000-0000-%';

-- Insert schools
REPLACE INTO
    schools (school_id, name, abbreviation)
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'School of Computation, Information and Technology',
        'CIT'
    );
