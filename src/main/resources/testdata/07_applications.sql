-- =============================================
-- 07_applications.sql
-- Inserts example applications
-- Preconditions:
--   - applicants must exists
-- =============================================


-- clean existing data
DELETE
FROM applications
WHERE application_id LIKE '00000000-0000-0000-0000-30000002%';

-- insert test data
REPLACE INTO applications (
  application_id,
  applicant_id,
  job_id,
  application_state,
  desired_start_date,
  projects,
  special_skills,
  motivation,
  rating,
  created_at,
  last_modified_at
)
VALUES
('00000000-0000-0000-0000-300000020001', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000020001',
 'SENT', '2025-10-15',
 'Developed a quiz platform with gamification features for a university course. Built a dashboard analyzing online learning data. Prototyped an AI teaching assistant.',
 'Python, React, SQL, Figma, UX Testing',
 'I am passionate about educational technology and have experience designing engaging learning experiences. This position aligns perfectly with my skills and interests.',
 NULL, '2025-02-01 14:30:00', '2025-02-01 14:30:00'),

('00000000-0000-0000-0000-300000023331', '11111111-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000020001',
 'REJECTED', '2025-10-15',
 'Developed a quiz platform with gamification features for a university course. Built a dashboard analyzing online learning data. Prototyped an AI teaching assistant.',
 'Python, React, SQL, Figma, UX Testing',
 'I am passionate about educational technology and have experience designing engaging learning experiences. This position aligns perfectly with my skills and interests.',
 NULL, '2025-02-01 14:30:00', '2025-02-01 14:30:00'),

('00000000-0000-0000-0000-300000020002', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020001',
 'IN_REVIEW', '2025-10-01',
 'Conducted user research on educational apps. Designed interfaces for learning management systems. Published paper on motivation in digital learning.',
 'User Research, Psychology, Statistics, Qualtrics',
 'My psychology background gives me unique insights into motivation systems for learning. I want to apply this knowledge to improve educational technology.',
 NULL, '2025-02-05 10:15:00', '2025-02-05 10:15:00'),

('00000000-0000-0000-0000-300000020003', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020002',
 'ACCEPTED', '2025-09-15',
 'Built recommendation systems for e-learning platforms. Published paper on collaborative filtering in education. Developed ML models for personalized learning.',
 'Python, Machine Learning, Recommender Systems, Pandas',
 'I have worked on similar recommendation problems in education and would love to contribute to research that improves learning personalization.',
 3, '2025-02-10 11:20:00', '2025-02-20 15:00:00'),

('00000000-0000-0000-0000-300000020123', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020004',
 'JOB_CLOSED', '2025-10-15',
 'Research on approximation algorithms for network problems. Implemented several graph algorithms in Python. Coursework in advanced algorithms.',
 'Python, C++, Algorithms, Complexity Theory',
 'I am fascinated by theoretical computer science and want to gain research experience in algorithms before applying to PhD programs.',
 NULL, '2025-02-12 09:45:00', '2025-02-12 09:45:00'),

('00000000-0000-0000-0000-300000020111', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020005',
 'SENT', '2025-08-15',
 'Coursework in quantum mechanics and quantum computing. Developed quantum simulation software. Research internship in quantum information.',
 'Python, Physics, Quantum Mechanics, Numerical Methods',
 'While my background is more in physics than CS, I have strong quantum mechanics knowledge and programming skills that would benefit this research.',
 NULL, '2025-02-18 15:20:00', '2025-03-02 10:15:00'),

('00000000-0000-0000-0000-300000020837', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020006',
 'REJECTED', '2025-10-01',
 'Designed analog circuits for sensor interfaces. Course projects on amplifier design. Internship at semiconductor company.',
 'Cadence, Analog Design, SPICE, Lab Equipment',
 'I have hands-on experience with analog design and want to apply these skills to research with practical applications.',
 1, '2025-02-05 10:15:00', '2025-02-05 10:15:00'),

('00000000-0000-0000-0000-300000020313', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000020010',
 'SAVED', '2025-11-15',
 NULL,
 NULL,
 'My experience with material characterization aligns well with this position. I am excited about contributing to climate solutions.',
 NULL, '2025-02-12 09:45:00', '2025-02-12 09:45:00');

('00000000-0000-0000-0000-300000020004', '11111111-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000020002',
 'JOB_CLOSED', '2025-09-01',
 'Built recommendation systems for e-learning platforms. Published paper on collaborative filtering in education. Developed ML models for personalized learning.',
 'Python, Machine Learning, Recommender Systems, Pandas',
 'I have worked on similar recommendation problems in education and would love to contribute to research that improves learning personalization.',
 NULL, '2025-06-15 13:45:00', '2025-06-15 13:45:00'),

('00000000-0000-0000-0000-300000020005', '11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000020004',
 'SENT', '2025-10-15',
 'Research on approximation algorithms for network problems. Implemented several graph algorithms in Python. Coursework in advanced algorithms.',
 'Python, C++, Algorithms, Complexity Theory',
 'I am fascinated by theoretical computer science and want to gain research experience in algorithms before applying to PhD programs.',
 NULL, '2025-02-12 09:45:00', '2025-02-12 09:45:00'),

('00000000-0000-0000-0000-300000020006', '11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000020004',
 'IN_REVIEW', '2025-09-01',
 'Developed optimization algorithms for scheduling problems. Published paper on parallel algorithms. Teaching assistant for algorithms course.',
 'Java, Algorithm Design, Mathematical Proofs, LaTeX',
 'My background in discrete mathematics and algorithm design makes me well-suited for this research position. I enjoy both theoretical and practical aspects of algorithms.',
 NULL, '2025-02-18 15:20:00', '2025-02-18 15:20:00'),

('00000000-0000-0000-0000-300000020007', '11111111-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000020005',
 'ACCEPTED', '2025-09-01',
 'Research on quantum algorithms for machine learning. Implemented quantum circuits for optimization problems. Published paper on quantum error correction.',
 'Qiskit, Python, Quantum Computing, Linear Algebra',
 'I have experience with quantum algorithms and want to contribute to research that pushes the boundaries of quantum computing applications.',
 4, '2025-02-15 13:45:00', '2025-03-01 11:30:00'),

('00000000-0000-0000-0000-300000020008', '11111111-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000020005',
 'REJECTED', '2025-08-15',
 'Coursework in quantum mechanics and quantum computing. Developed quantum simulation software. Research internship in quantum information.',
 'Python, Physics, Quantum Mechanics, Numerical Methods',
 'While my background is more in physics than CS, I have strong quantum mechanics knowledge and programming skills that would benefit this research.',
 2, '2025-02-18 15:20:00', '2025-03-02 10:15:00'),

('00000000-0000-0000-0000-300000020009', '11111111-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000020006',
 'JOB_CLOSED', '2025-08-01',
 'Designed analog circuits for sensor interfaces. Course projects on amplifier design. Internship at semiconductor company.',
 'Cadence, Analog Design, SPICE, Lab Equipment',
 'I have hands-on experience with analog design and want to apply these skills to research with practical applications.',
 NULL, '2025-06-01 10:00:00', '2025-06-01 10:00:00'),

('00000000-0000-0000-0000-300000020010', '11111111-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000020007',
 'SENT', '2025-09-15',
 'Undergraduate research in molecular biology. Lab work on DNA extraction and analysis. Coursework in genetics and biochemistry.',
 'PCR, Gel Electrophoresis, DNA Sequencing, Lab Safety',
 'I am excited about genetics research and want to gain more lab experience before applying to graduate programs.',
 NULL, '2025-02-05 14:30:00', '2025-02-05 14:30:00'),

('00000000-0000-0000-0000-300000020011', '11111111-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000020007',
 'IN_REVIEW', '2025-10-01',
 'Research assistant in plant genetics lab. Conducted DNA barcoding project. Presented at undergraduate research symposium.',
 'Molecular Biology Techniques, Data Analysis, Scientific Writing',
 'My experience in genetics research makes me well-prepared for this position. I am particularly interested in applications to agriculture.',
 NULL, '2025-02-10 10:15:00', '2025-02-10 10:15:00'),

('00000000-0000-0000-0000-300000020012', '11111111-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000020009',
 'JOB_CLOSED', '2025-09-01',
 'Urban design projects focusing on sustainability. GIS analysis of green spaces. Community engagement for park redesign.',
 'GIS, AutoCAD, SketchUp, Community Engagement',
 'I am passionate about creating sustainable urban spaces and have both technical and social skills for this position.',
 NULL, '2025-06-15 13:45:00', '2025-06-15 13:45:00'),

('00000000-0000-0000-0000-300000020013', '11111111-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000020010',
 'SENT', '2025-11-15',
 'Research on porous materials for gas storage. Characterization of adsorbent materials. Published paper on MOF synthesis.',
 'Material Synthesis, XRD, BET, Gas Adsorption',
 'My experience with material characterization aligns well with this position. I am excited about contributing to climate solutions.',
 NULL, '2025-02-12 09:45:00', '2025-02-12 09:45:00');
