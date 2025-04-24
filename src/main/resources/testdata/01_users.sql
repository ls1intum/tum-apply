-- =============================================
-- 01_users.sql
-- Inserts example users
-- Preconditions:
--   - No foreign key constraints violated (research_groups will be inserted later)
--   - avatar_file_id, cv_file_id, bachelor_certificate_id, master_certificate_id may be NULL
-- =============================================

-- Clean up existing users
DELETE
FROM users
WHERE user_id IN ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102',
                  '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000104',
                  '00000000-0000-0000-0000-000000000105');

-- Insert users (standard + edge cases)
REPLACE INTO users (user_id,
                    research_group_id,
                    email,
                    avatar_file_id,
                    first_name,
                    last_name,
                    gender,
                    nationality,
                    phone_number,
                    website,
                    linkedin_url)
VALUES ('00000000-0000-0000-0000-000000000101',
        NULL,
        'admin@tumapply.de',
        NULL,
        'System',
        'Admin',
        NULL,
        'DE',
        NULL,
        NULL,
        NULL),
       ('00000000-0000-0000-0000-000000000102',
        NULL,
        'professor@tum.de',
        NULL,
        'Anna',
        'Muster',
        'female',
        'DE',
        '+49123456789',
        'https://ai.tum.de',
        NULL),
       ('00000000-0000-0000-0000-000000000103',
        NULL,
        'applicant@gmail.com',
        NULL,
        'Max',
        'Example',
        'male',
        'DE',
        NULL,
        NULL,
        'https://linkedin.com/in/max'),
       ('00000000-0000-0000-0000-000000000104',
        NULL,
        'external@uni.de',
        NULL,
        'Sara',
        'Extern',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL),
       ('00000000-0000-0000-0000-000000000105',
        NULL,
        'professor2@tum.de',
        NULL,
        'Professor2',
        'TUM',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL);
