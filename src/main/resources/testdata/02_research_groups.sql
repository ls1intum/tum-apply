-- =============================================
-- 02_research_groups.sql
-- Inserts example research groups
-- Preconditions:
--   - User with user_id '00000000-0000-0000-0000-000000000101' exists (created_by)
--   - User with user_id '00000000-0000-0000-0000-000000000102' exists (head)
-- =============================================

-- Clean up
DELETE
FROM research_groups
WHERE research_group_id IN
      ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Insert research groups
REPLACE INTO research_groups (research_group_id,
                              head,
                              name,
                              abbreviation,
                              email,
                              website,
                              school,
                              description,
                              default_field_of_studies,
                              street,
                              postal_code,
                              city)
VALUES ('00000000-0000-0000-0000-000000000001',
        'Prof. Dr. Stephan Krusche',
        'Applied Education Technologies',
        'AET',
        'aet@tum.de',
        'https://aet.cit.tum.de',
        'CIT',
        'The research group develops innovative...',
        'Informatics',
        'Boltzmannstrasse 3',
        '85748',
        'Garching b. München'),
       ('00000000-0000-0000-0000-000000000002',
        'Prof. Dr. Paulina Krüger',
        'Data Science Group',
        'DSG',
        'data@tum.de',
        'https://ds.cit.tum.de',
        'CIT',
        'Research on data and AI',
        'Data Science',
        'Friedrichstraße 12',
        '10117',
        'Berlin');

-- =============================================
-- 02b_assign_users_to_research_groups.sql
-- Assigns existing users to research groups
-- Preconditions:
--   - Users must exist (from 01_users.sql)
--   - Research groups must exist (from 02_research_groups.sql)
-- =============================================

-- User: admin → no group needed (skip)
-- User: professor@tum.de → AET
UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id = '00000000-0000-0000-0000-000000000102';

-- User: reviewer@tum.de → DSG
UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000002'
WHERE user_id = '00000000-0000-0000-0000-000000000105';
