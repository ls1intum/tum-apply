-- =============================================
-- 02_research_groups.sql
-- Inserts example research groups
-- Preconditions:
--   - User with user_id '00000000-0000-0000-0000-000000000101' exists (created_by)
--   - User with user_id '00000000-0000-0000-0000-000000000102' exists (head)
-- =============================================

-- Clean up
DELETE FROM research_groups
WHERE
    research_group_id LIKE '00000000-0000-0000-0000-%';

-- Insert research groups

REPLACE INTO
    research_groups (
        research_group_id,
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
        city,
        university_id
    )
VALUES (
        '00000000-0000-0000-0000-000000000001',
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
        'Garching b. München',
        '0000001'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'Prof. Dr. Paulina Krüger',
        'Data Science Group',
        'DSG',
        'data@tum.de',
        'https://ds.cit.tum.de',
        'CIT',
        '<p>The <strong>Data Science Group</strong> conducts cutting-edge research on machine learning, AI, and big data analytics. We aim to turn complex data into actionable knowledge through advanced modeling techniques and explainable AI.</p><p>Our interdisciplinary projects span healthcare, finance, and environmental science.</p>',
        'Data Science',
        'Friedrichstraße 12',
        '10117',
        'Berlin',
        '0000002'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'Prof. Dr. Markus Vogt',
        'Quantum Computing Lab',
        'QCL',
        'qcl@tum.de',
        'https://qcl.tum.de',
        'CIT',
        '<p>The <strong>Quantum Computing Lab</strong> is dedicated to research on quantum algorithms, simulations, and quantum machine learning. We explore the computational advantages of quantum systems for real-world applications in cryptography and optimization.</p><p>Our lab combines theoretical foundations with experimental implementations using quantum hardware.</p>',
        'Physics',
        'Max-Planck-Str. 1',
        '85748',
        'Garching',
        '0000001'
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        'Prof. Dr. Laura Meier',
        'Biomedical Engineering Group',
        'BEG',
        'bioeng@tum.de',
        'https://beg.tum.de',
        'Engineering',
        '<p>The <strong>Biomedical Engineering Group</strong> focuses on medical technologies, including wearable devices, neuroprosthetics, and digital health systems. Our interdisciplinary team collaborates with clinicians to design devices that improve patient outcomes.</p><p>We emphasize usability, safety, and effectiveness in our innovations.</p>',
        'Bioengineering',
        'Walther-Meißner-Str. 8',
        '85748',
        'Garching',
        '0000001'
    ),
    (
        '00000000-0000-0000-0000-000000000005',
        'Prof. Dr. Ahmed Al-Farsi',
        'Renewable Energy Systems',
        'RES',
        'res@tum.de',
        'https://res.tum.de',
        'Mechanical Engineering',
        '<p><strong>Renewable Energy Systems</strong> addresses the global need for sustainable energy solutions. We develop smart grid technologies, energy storage systems, and optimization strategies for renewable energy integration into modern infrastructures.</p><p>Our work includes both simulation and real-world prototyping.</p>',
        'Electrical Engineering',
        'Theresienstrasse 90',
        '80333',
        'Munich',
        '0000003'
    ),
    (
        '00000000-0000-0000-0000-000000000006',
        'Prof. Dr. Anika Roth',
        'Human-Robot Interaction Lab',
        'HRIL',
        'hri@tum.de',
        'https://hril.tum.de',
        'CIT',
        '<p>The <strong>Human-Robot Interaction Lab</strong> investigates how people interact with intelligent machines. Our work spans social robotics, assistive technologies, and human factors engineering. We prototype new interaction models and evaluate them in real-world settings.</p><p>Our research bridges cognitive science and robotics.</p>',
        'Robotics',
        'Karlstraße 45',
        '80333',
        'Munich',
        '0000003'
    ),
    (
        '00000000-0000-0000-0000-000000000007',
        'Prof. Dr. Jonas Weber',
        'Climate Systems Research',
        'CSR',
        'climate@tum.de',
        'https://climatesystems.tum.de',
        'Environmental Science',
        '<p>The <strong>Climate Systems Research</strong> group studies atmospheric dynamics, climate change models, and environmental risk assessment. We contribute to global climate models, sustainability strategies, and green policy design through simulations and field studies.</p><p>Collaboration with policymakers and NGOs is a key part of our mission.</p>',
        'Environmental Engineering',
        'Lothstraße 34',
        '80335',
        'Munich',
        '0000003'
    ),
    (
        '00000000-0000-0000-0000-000000000008',
        'Prof. Dr. Isabella Conti',
        'Digital Humanities Lab',
        'DHL',
        'dhlab@tum.de',
        'https://dhl.tum.de',
        'Humanities',
        '<p>The <strong>Digital Humanities Lab</strong> applies computational techniques to classical and contemporary humanities research. Projects include text mining, cultural heritage digitization, and network analysis in literature and history.</p><p>We aim to foster interdisciplinary approaches between humanities and technology.</p>',
        'Digital Humanities',
        'Luisenstraße 37',
        '80333',
        'Munich',
        '0000003'
    ),
    (
        '00000000-0000-0000-0000-000000000009',
        'Prof. Dr. Michael Tan',
        'Nano-Materials Group',
        'NMG',
        'nano@tum.de',
        'https://nano.tum.de',
        'Chemistry',
        '<p>The <strong>Nano-Materials Group</strong> focuses on the synthesis, characterization, and application of nano-structured materials. Our research supports breakthroughs in photonics, electronics, and biomedical devices.</p><p>We emphasize sustainability and efficiency in material science innovation.</p>',
        'Materials Science',
        'Chemiestraße 21',
        '85748',
        'Garching',
        '0000001'
    ),
    (
        '00000000-0000-0000-0000-000000000010',
        'Prof. Dr. Sophie Dubois',
        'Computational Linguistics Research',
        'CLR',
        'clr@tum.de',
        'https://clr.tum.de',
        'Linguistics',
        '<p>The <strong>Computational Linguistics Research</strong> group investigates natural language processing, semantics, and language modeling. We study multilingual corpora, dialogue systems, and linguistic fairness in AI.</p><p>Our tools power translation services, chatbots, and educational software.</p>',
        'Linguistics',
        'Sprachstraße 10',
        '80331',
        'Munich',
        '0000003'
    );

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
SET
    research_group_id = '00000000-0000-0000-0000-000000000001'
WHERE
    user_id = '00000000-0000-0000-0000-000000000102';

-- User: reviewer@tum.de → DSG
UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000002'
WHERE
    user_id = '00000000-0000-0000-0000-000000000105';

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000003' -- Quantum Computing Lab
WHERE
    user_id = '11111111-0000-0000-0000-000000000002';
-- John Doe

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000004' -- Biomedical Engineering Group
WHERE
    user_id = '11111111-0000-0000-0000-000000000003';
-- Alice Nguyen

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000005' -- Renewable Energy Systems
WHERE
    user_id = '11111111-0000-0000-0000-000000000004';
-- Ricardo Martínez

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000006' -- Human-Robot Interaction Lab
WHERE
    user_id = '11111111-0000-0000-0000-000000000005';
-- Yuki Tanaka

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000007' -- Climate Systems Research
WHERE
    user_id = '11111111-0000-0000-0000-000000000008';
-- Emma Johnson

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000008' -- Digital Humanities Lab
WHERE
    user_id = '11111111-0000-0000-0000-000000000009';
-- Lucas Rossi

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000009' -- Nano-Materials Group
WHERE
    user_id = '11111111-0000-0000-0000-000000000010';
-- Fatima Khan

UPDATE users
SET
    research_group_id = '00000000-0000-0000-0000-000000000010' -- Computational Linguistics Research
WHERE
    user_id = '11111111-0000-0000-0000-000000000012';
-- Daniel Kim