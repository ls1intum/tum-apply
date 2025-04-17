-- =============================================
-- 03_user_roles.sql
-- Inserts roles for users
-- Preconditions:
--   - Users must exist
--   - Research groups must exist (for scoped roles)
-- =============================================

-- Clean up
DELETE
FROM user_roles
WHERE user_id IN ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102',
                  '00000000-0000-0000-0000-000000000105');

-- Insert user roles
REPLACE INTO user_roles (user_id,
                         role,
                         research_group_id)
VALUES ('00000000-0000-0000-0000-000000000101',
        'admin',
        NULL),
       ('00000000-0000-0000-0000-000000000102',
        'professor',
        '00000000-0000-0000-0000-000000000001'),
       ('00000000-0000-0000-0000-000000000103',
        'applicant',
        NULL),
       ('00000000-0000-0000-0000-000000000104',
        'applicant',
        NULL),
       ('00000000-0000-0000-0000-000000000105',
        'reviewer',
        '00000000-0000-0000-0000-000000000002');
