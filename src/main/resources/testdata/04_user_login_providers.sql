-- =============================================
-- 04_user_login_providers.sql
-- Inserts login providers linked to users
-- Preconditions:
--   - Users must exist
-- =============================================

-- Clean up
DELETE
FROM user_login_providers
WHERE user_id IN ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000103',
                  '00000000-0000-0000-0000-000000000104'
  );

-- Insert login providers
REPLACE INTO user_login_providers (user_id,
                                   login_provider)
VALUES ('00000000-0000-0000-0000-000000000101',
        'tum'),
       ('00000000-0000-0000-0000-000000000102',
        'tum'),
       ('00000000-0000-0000-0000-000000000103',
        'google'),
       ('00000000-0000-0000-0000-000000000104',
        'microsoft'),
       ('00000000-0000-0000-0000-000000000104',
        'apple'),
       ('00000000-0000-0000-0000-000000000105',
        'tum');
