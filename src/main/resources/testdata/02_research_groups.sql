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
        '<p>The Applied Education Technologies group focuses on the intersection of digital tools and learning science. Our work includes research into scalable education platforms, user engagement, and gamified learning experiences. We aim to make education more effective and accessible using technology.</p>',
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
        'Berlin'),
       ('00000000-0000-0000-0000-000000000003',
        'Prof. Dr. Markus Vogt',
        'Quantum Computing Lab',
        'QCL',
        'qcl@tum.de',
        'https://qcl.tum.de',
        'CIT',
        'Research on quantum algorithms and simulations.',
        'Physics',
        'Max-Planck-Str. 1',
        '85748',
        'Garching'),

       ('00000000-0000-0000-0000-000000000004',
        'Prof. Dr. Laura Meier',
        'Biomedical Engineering Group',
        'BEG',
        'bioeng@tum.de',
        'https://beg.tum.de',
        'Engineering',
        'Focused on medical devices and neuroprosthetics.',
        'Bioengineering',
        'Walther-Meißner-Str. 8',
        '85748',
        'Garching'),

       ('00000000-0000-0000-0000-000000000005',
        'Prof. Dr. Ahmed Al-Farsi',
        'Renewable Energy Systems',
        'RES',
        'res@tum.de',
        'https://res.tum.de',
        'Mechanical Engineering',
        'Develops sustainable energy solutions using smart grids.',
        'Electrical Engineering',
        'Theresienstrasse 90',
        '80333',
        'Munich'),

       ('00000000-0000-0000-0000-000000000006',
        'Prof. Dr. Anika Roth',
        'Human-Robot Interaction Lab',
        'HRIL',
        'hri@tum.de',
        'https://hril.tum.de',
        'CIT',
        'Explores interaction models between humans and robots.',
        'Robotics',
        'Karlstraße 45',
        '80333',
        'Munich'),

       ('00000000-0000-0000-0000-000000000007',
        'Prof. Dr. Jonas Weber',
        'Climate Systems Research',
        'CSR',
        'climate@tum.de',
        'https://climatesystems.tum.de',
        'Environmental Science',
        'Studies climate modeling and environmental change.',
        'Environmental Engineering',
        'Lothstraße 34',
        '80335',
        'Munich'),

       ('00000000-0000-0000-0000-000000000008',
        'Prof. Dr. Isabella Conti',
        'Digital Humanities Lab',
        'DHL',
        'dhlab@tum.de',
        'https://dhl.tum.de',
        'Humanities',
        'Applies computational methods to humanistic research.',
        'Digital Humanities',
        'Luisenstraße 37',
        '80333',
        'Munich'),

       ('00000000-0000-0000-0000-000000000009',
        'Prof. Dr. Michael Tan',
        'Nano-Materials Group',
        'NMG',
        'nano@tum.de',
        'https://nano.tum.de',
        'Chemistry',
        'Focus on design and analysis of nano-structured materials.',
        'Materials Science',
        'Chemiestraße 21',
        '85748',
        'Garching'),

       ('00000000-0000-0000-0000-000000000010',
        'Prof. Dr. Sophie Dubois',
        'Computational Linguistics Research',
        'CLR',
        'clr@tum.de',
        'https://clr.tum.de',
        'Linguistics',
        'Research on NLP, semantics, and language models.',
        'Linguistics',
        'Sprachstraße 10',
        '80331',
        'Munich');


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

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000003' -- Quantum Computing Lab
WHERE user_id = '11111111-0000-0000-0000-000000000002'; -- John Doe

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000004' -- Biomedical Engineering Group
WHERE user_id = '11111111-0000-0000-0000-000000000003'; -- Alice Nguyen

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000005' -- Renewable Energy Systems
WHERE user_id = '11111111-0000-0000-0000-000000000004'; -- Ricardo Martínez

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000006' -- Human-Robot Interaction Lab
WHERE user_id = '11111111-0000-0000-0000-000000000005'; -- Yuki Tanaka

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000007' -- Climate Systems Research
WHERE user_id = '11111111-0000-0000-0000-000000000008'; -- Emma Johnson

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000008' -- Digital Humanities Lab
WHERE user_id = '11111111-0000-0000-0000-000000000009'; -- Lucas Rossi

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000009' -- Nano-Materials Group
WHERE user_id = '11111111-0000-0000-0000-000000000010'; -- Fatima Khan

UPDATE users
SET research_group_id = '00000000-0000-0000-0000-000000000010' -- Computational Linguistics Research
WHERE user_id = '11111111-0000-0000-0000-000000000012'; -- Daniel Kim
