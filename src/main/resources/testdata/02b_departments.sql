-- =============================================
-- 02b_departments.sql
-- Inserts example departments
-- Preconditions:
--   - School with school_id '00000000-0000-0000-0000-000000000001' exists (from 02a_schools.sql)
-- =============================================

-- Clean up
DELETE FROM departments
WHERE
    department_id LIKE '00000000-0000-0000-0000-%';

-- Insert departments
REPLACE INTO
    departments (
        department_id,
        name,
        school_id
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Mathematics',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Computer Science',
        '00000000-0000-0000-0000-000000000001'
    );
