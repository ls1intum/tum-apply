-- =============================================
-- 01_users.sql
-- Inserts example users
-- Preconditions:
--   - No foreign key constraints violated (research_groups will be inserted later)
--   - avatar_file_id, cv_file_id, bachelor_certificate_id, master_certificate_id may be NULL
-- =============================================
-- Clean up existing users
DELETE FROM users
WHERE
        user_id IN (
                '00000000-0000-0000-0000-000000000101',
                '00000000-0000-0000-0000-000000000102',
                '00000000-0000-0000-0000-000000000103',
                '00000000-0000-0000-0000-000000000104',
                '00000000-0000-0000-0000-000000000105',
                '00000000-0000-0000-0000-000000000106',
                '00000000-0000-0000-0000-000000000107',
                '00000000-0000-0000-0000-000000000108',
                '00000000-0000-0000-0000-000000000109',
                '00000000-0000-0000-0000-000000000110'
        );

-- Insert users (standard + edge cases)
REPLACE INTO users (
        user_id,
        research_group_id,
        email,
        avatar,
        first_name,
        last_name,
        gender,
        nationality,
        birthday,
        phone_number,
        website,
        linkedin_url,
        selected_language
)
VALUES
        (
                '00000000-0000-0000-0000-000000000101',
                NULL,
                'admin@tumapply.de',
                NULL,
                'System',
                'Admin',
                NULL,
                'de',
                NULL,
                NULL,
                NULL,
                NULL,
                'en'
        ),
        (
                '00000000-0000-0000-0000-000000000102',
                NULL,
                'professor@tum.de',
                NULL,
                'Anna',
                'Muster',
                'female',
                'de',
                '1990-01-01',
                '+49123456789',
                'https://ai.tum.de',
                NULL,
                'de'
        ),
        (
                '00000000-0000-0000-0000-000000000103',
                NULL,
                'applicant@gmail.com',
                NULL,
                'Max',
                'Example',
                'male',
                'de',
                '1999-05-26',
                NULL,
                NULL,
                'https://linkedin.com/in/max',
                'de'
        ),
        (
                '00000000-0000-0000-0000-000000000104',
                NULL,
                'external@uni.de',
                NULL,
                'Sara',
                'Extern',
                NULL,
                NULL,
                '1995-12-31',
                NULL,
                NULL,
                NULL,
                'en'
        ),
        (
                '00000000-0000-0000-0000-000000000105',
                NULL,
                'professor2@tum.de',
                NULL,
                'Professor2',
                'TUM',
                NULL,
                NULL,
                NULL,
                NULL,
                NULL,
                NULL,
                'en'
        ),
        (
                '00000000-0000-0000-0000-000000000106',
                NULL,
                'longnameperson@intl.edu',
                NULL,
                'Jean-Pierre-Étienne',
                'Van Der Straaten-Sánchez',
                'male',
                'be',
                '1975-07-20',
                '+3225551234',
                'https://intl.edu/users/jps',
                NULL,
                'fr'
        );