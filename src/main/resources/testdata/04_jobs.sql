-- =============================================
-- 04_jobs.sql
-- Inserts example jobs
-- Preconditions:
--   - Users (professors) must already exist
--   - postedBy references users.user_id (professor)
-- =============================================

-- Clean up existing jobs
DELETE FROM jobs
WHERE job_id LIKE '00000000-0000-0000-0000-00000002%';

-- Insert example jobs
REPLACE INTO jobs (job_id,
                   professor_id,
                   research_group_id,
                   field_of_studies,
                   research_area,
                   location,
                   workload,
                   contract_duration,
                   funding_type,
                   title,
                   description,
                   tasks,
                   requirements,
                   state,
                   start_date,
                   created_at,
                   last_modified_at)
VALUES
-- Research Group 1 (5 jobs)
('00000000-0000-0000-0000-000000020001', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Informatics', 'Gamified Learning', 'GARCHING', 20, 1, 'SCHOLARSHIP', 'Gamification in Education Intern',
 '<p><strong>Join our interdisciplinary team</strong> working on next-gen gamified learning tools in higher education. This role supports research in human-computer interaction (HCI), behavioral science, and UX design.</p><p>You will contribute to designing playful, motivating, and effective learning experiences for university students.</p>',
 '<ul><li>Design and prototype interactive game elements</li><li>Conduct user surveys and usability testing</li><li>Analyze engagement data to inform design choices</li></ul>',
 '<ul><li>Enrolled in B.Sc. program in HCI, Psychology, Computer Science, or related field</li><li>Interest in gamification and digital education</li><li>Basic knowledge of user research and design tools (e.g., Figma, Qualtrics)</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),

('00000000-0000-0000-0000-000000020002', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Informatics', 'Educational Technology', 'GARCHING', NULL, NULL, 'RESEARCH_GRANT', 'Learning Analytics Researcher',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 10:30:00', '2025-02-10 10:30:00'),

('00000000-0000-0000-0000-000000020003', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Informatics', 'Interactive Platforms', 'GARCHING', 30, 2, 'SELF_FUNDED', 'EdTech Interface Designer',
 '<p>Design and evaluate learning interfaces for our educational platforms. You will work closely with researchers and developers to create intuitive user experiences.</p>',
 '<ul><li>Create wireframes and prototypes using Figma</li><li>Conduct usability studies with students</li><li>Iterate designs based on feedback</li></ul>',
 '<ul><li>Currently enrolled in Design, HCI or related program</li><li>Experience with design tools</li><li>Understanding of UX principles</li></ul>',
 'CLOSED', '2025-11-01', '2025-01-20 14:15:00', '2025-01-25 16:45:00'),

('00000000-0000-0000-0000-000000020004', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Informatics', 'Learning Analytics', 'MUNICH', 30, 2, 'RESEARCH_GRANT', 'Student Engagement Analytics Intern',
 '<p>Join the AET research group to explore how time-series data can enhance student engagement in digital learning environments. This internship focuses on analyzing interaction patterns and developing models to support adaptive educational technologies.</p>',
 '<ul><li>Analyze behavioral data from online learning platforms</li><li>Develop engagement forecasting models using tools like ARIMA or LSTM</li><li>Collaborate with UX designers and educational researchers to translate findings into platform improvements</li></ul>',
 '<ul><li>Enrolled in a Master’s program in Data Science, HCI, Educational Technology, or related fields</li><li>Experience with Python and time-series analysis</li><li>Interest in data-driven learning innovation and user-centered design</li></ul>',
 'CLOSED', '2025-09-01', '2025-01-05 11:20:00', '2025-06-30 09:00:00'),

('00000000-0000-0000-0000-000000020005', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Informatics', 'Assessment Technology', 'GARCHING', 40, 3, 'RESEARCH_GRANT', 'Automated Grading Researcher',
 '<p>Develop automated grading tools for online platforms using machine learning techniques.</p>',
 '<ul><li>Develop ML models for answer evaluation</li><li>Annotate training data</li><li>Test model accuracy</li></ul>',
 '<ul><li>CS or Data Science MSc</li><li>Experience with NLP</li><li>Python programming</li></ul>',
 'APPLICANT_FOUND', '2025-10-15', '2025-01-10 13:45:00', '2025-03-15 17:30:00'),

-- Research Group 2 (5 jobs)
('00000000-0000-0000-0000-000000020006', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Data Science', 'Recommender Systems', 'MUNICH', 25, 2, 'FULLY_FUNDED', 'Personalized Recommendation Research',
 '<p>Develop algorithms for personalizing educational content recommendations based on student behavior.</p>',
 '<ul><li>Implement matrix factorization</li><li>Test collaborative filtering approaches</li><li>Evaluate recommendation quality</li></ul>',
 '<ul><li>MSc in DS/ML</li><li>Python skills</li><li>Understanding of recsys</li></ul>',
 'PUBLISHED', '2025-09-15', '2025-02-01 10:00:00', '2025-02-01 10:00:00'),

('00000000-0000-0000-0000-000000020007', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Data Science', 'Ethical AI', 'MUNICH', NULL, NULL, 'GOVERNMENT_FUNDED', 'Bias Detection in ML Models',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-15 14:30:00', '2025-02-15 14:30:00'),

('00000000-0000-0000-0000-000000020008', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Data Science', 'Natural Language Processing', 'HEILBRONN', 40, 3, 'INDUSTRY_SPONSORED', 'Multilingual NLP Research',
 '<p>Build NLP models that work across multiple languages for educational applications.</p>',
 '<ul><li>Preprocess multilingual text</li><li>Train transformer models</li><li>Evaluate performance</li></ul>',
 '<ul><li>MSc in CS/Linguistics</li><li>NLP experience</li><li>Python proficiency</li></ul>',
 'PUBLISHED', '2025-10-15', '2025-02-05 11:15:00', '2025-02-10 16:20:00'),

('00000000-0000-0000-0000-000000020009', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Data Science', 'Data Visualization', 'HEILBRONN', 30, 2, 'SCHOLARSHIP', 'Visual Analytics Research Assistant',
 '<p>Visualize complex educational datasets to help researchers understand student learning patterns.</p>',
 '<ul><li>Create interactive visualizations</li><li>Design dashboards</li><li>Conduct user testing</li></ul>',
 '<ul><li>MSc in DS, HCI or InfoVis</li><li>D3.js/Tableau experience</li><li>Design skills</li></ul>',
 'CLOSED', '2025-11-01', '2025-02-01 09:30:00', '2025-07-15 14:00:00'),

('00000000-0000-0000-0000-000000020010', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000002', 'Data Science', 'Time Series Analysis', 'MUNICH', 30, 2, 'RESEARCH_GRANT', 'Time Series Forecasting Intern',
 '<p>Work with educational time-series data to predict student performance trends.</p>',
 '<ul><li>Clean and process data</li><li>Implement forecasting models</li><li>Analyze results</li></ul>',
 '<ul><li>CS or Stats background</li><li>Python skills</li><li>ML knowledge</li></ul>',
 'APPLICANT_FOUND', '2025-09-01', '2025-01-20 13:00:00', '2025-03-10 11:45:00'),

-- Research Group 3 (5 jobs)
('00000000-0000-0000-0000-000000020011', '11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Data Science', 'Deep Learning', 'MUNICH', 40, 3, 'FULLY_FUNDED', 'Researcher in Deep Learning',
 '<p>Join our cutting-edge research in neural networks applied to medical imaging.</p>',
 '<ul><li>Develop new architectures</li><li>Test models</li><li>Publish results</li></ul>',
 '<ul><li>Master in CS</li><li>Strong Python/ML skills</li></ul>',
 'PUBLISHED', '2025-09-01', '2025-01-10 10:00:00', '2025-01-10 10:00:00'),

('00000000-0000-0000-0000-000000020012', '11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Computer Vision', 'Medical Imaging', 'GARCHING', NULL, NULL, 'INDUSTRY_SPONSORED', 'Medical Image Analysis Research',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-20 15:30:00', '2025-02-20 15:30:00'),

('00000000-0000-0000-0000-000000020013', '11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Data Science', 'Data Privacy', 'MUNICH', 40, 3, 'RESEARCH_GRANT', 'Privacy-Preserving ML',
 '<p>Explore federated and encrypted learning techniques for sensitive educational data.</p>',
 '<ul><li>Design privacy protocols</li><li>Implement solutions</li><li>Evaluate trade-offs</li></ul>',
 '<ul><li>MSc in DS, CS, Math</li><li>Crypto knowledge</li></ul>',
 'PUBLISHED', '2025-09-01', '2025-01-15 11:45:00', '2025-01-20 14:30:00'),

('00000000-0000-0000-0000-000000020014', '11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Statistics', 'Bayesian Modeling', 'MUNICH', 30, 3, 'RESEARCH_GRANT', 'Bayesian Networks Researcher',
 '<p>Model uncertainty in educational systems using Bayesian approaches.</p>',
 '<ul><li>Implement inference methods</li><li>Apply MCMC techniques</li><li>Analyze results</li></ul>',
 '<ul><li>Math or Stats MSc</li><li>Probability background</li></ul>',
 'CLOSED', '2025-10-01', '2025-01-05 09:15:00', '2025-06-30 16:00:00'),

('00000000-0000-0000-0000-000000020015', '11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Software Engineering', 'Formal Verification', 'SINGAPORE', 30, 2, 'RESEARCH_GRANT', 'Verification Tools Research Assistant',
 '<p>Develop formal models and proofs for educational software verification.</p>',
 '<ul><li>Use tools like Isabelle or Coq</li><li>Develop proofs</li><li>Document results</li></ul>',
 '<ul><li>CS or Math MSc</li><li>Logic background</li></ul>',
 'APPLICANT_FOUND', '2025-10-01', '2025-01-25 14:00:00', '2025-03-01 10:30:00'),

-- Research Group 4 (5 jobs)
('00000000-0000-0000-0000-000000020016', '11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Mathematics', 'Theoretical Computer Science', 'GARCHING', 30, 2, 'SCHOLARSHIP', 'Research Assistant in Algorithms',
 '<p>Study complexity and optimization problems in computer science theory.</p>',
 '<ul><li>Collaborate on theory papers</li><li>Develop proofs</li><li>Analyze algorithms</li></ul>',
 '<ul><li>Bachelor or Master in Mathematics/CS</li><li>Strong theoretical background</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),

('00000000-0000-0000-0000-000000020017', '11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Mathematics', 'Cryptography', 'GARCHING', NULL, NULL, 'GOVERNMENT_FUNDED', 'Post-Quantum Cryptography Research',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 11:30:00', '2025-02-10 11:30:00'),

('00000000-0000-0000-0000-000000020018', '11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Mathematics', 'Number Theory', 'MUNICH', 40, 3, 'RESEARCH_GRANT', 'Number Theory Research Assistant',
 '<p>Investigate applications of number theory in modern cryptography.</p>',
 '<ul><li>Literature review</li><li>Algorithm development</li><li>Paper writing</li></ul>',
 '<ul><li>MSc in Mathematics</li><li>Algebra/number theory background</li></ul>',
 'PUBLISHED', '2025-09-15', '2025-01-20 14:00:00', '2025-01-25 16:00:00'),

('00000000-0000-0000-0000-000000020019', '11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Mathematics', 'Graph Theory', 'GARCHING', 20, 1, 'SCHOLARSHIP', 'Graph Theory Intern',
 '<p>Explore graph algorithms and their computational complexity.</p>',
 '<ul><li>Implement algorithms</li><li>Run benchmarks</li><li>Analyze results</li></ul>',
 '<ul><li>BSc in Math or CS</li><li>Programming skills</li></ul>',
 'CLOSED', '2025-07-01', '2025-01-05 09:00:00', '2025-06-30 10:00:00'),

('00000000-0000-0000-0000-000000020020', '11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Mathematics', 'Combinatorics', 'MUNICH', 30, 2, 'RESEARCH_GRANT', 'Combinatorial Optimization Researcher',
 '<p>Develop new approaches to combinatorial optimization problems.</p>',
 '<ul><li>Formulate problems</li><li>Design algorithms</li><li>Compare with existing methods</li></ul>',
 '<ul><li>MSc in Math or CS</li><li>Optimization background</li></ul>',
 'APPLICANT_FOUND', '2025-10-01', '2025-01-10 13:00:00', '2025-03-15 15:00:00'),

-- Research Group 5 (5 jobs)
('00000000-0000-0000-0000-000000020021', '11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Physics', 'Quantum Computing', 'GARCHING', 40, 3, 'FULLY_FUNDED', 'Quantum Algorithm Researcher',
 '<p>Develop and analyze algorithms for quantum computers.</p>',
 '<ul><li>Implement quantum circuits</li><li>Run simulations</li><li>Analyze results</li></ul>',
 '<ul><li>MSc in Physics or CS</li><li>Quantum computing knowledge</li></ul>',
 'PUBLISHED', '2025-09-01', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),

('00000000-0000-0000-0000-000000020022', '11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Physics', 'Plasma Physics', 'GARCHING', NULL, NULL, 'RESEARCH_GRANT', 'Fusion Research Support',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 11:30:00', '2025-02-10 11:30:00'),

('00000000-0000-0000-0000-000000020023', '11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Physics', 'Condensed Matter', 'GARCHING_HOCHBRUECK', 30, 2, 'RESEARCH_GRANT', 'Condensed Matter Research Assistant',
 '<p>Investigate novel materials using advanced microscopy techniques.</p>',
 '<ul><li>Prepare samples</li><li>Conduct experiments</li><li>Analyze data</li></ul>',
 '<ul><li>MSc in Physics</li><li>Lab experience</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-20 14:00:00', '2025-01-25 16:00:00'),

('00000000-0000-0000-0000-000000020024', '11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Physics', 'Astrophysics', 'GARCHING', 20, 1, 'SCHOLARSHIP', 'Astrophysics Data Analysis Intern',
 '<p>Analyze astronomical data from telescopes and satellites.</p>',
 '<ul><li>Process imaging data</li><li>Run statistical analyses</li><li>Prepare visualizations</li></ul>',
 '<ul><li>BSc in Physics or Astronomy</li><li>Python skills</li></ul>',
 'CLOSED', '2025-07-01', '2025-01-05 09:00:00', '2025-06-30 10:00:00'),

('00000000-0000-0000-0000-000000020025', '11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Physics', 'Particle Physics', 'GARCHING', 40, 3, 'RESEARCH_GRANT', 'Particle Physics Researcher',
 '<p>Analyze data from particle collider experiments.</p>',
 '<ul><li>Process collision data</li><li>Develop analysis pipelines</li><li>Contribute to publications</li></ul>',
 '<ul><li>MSc in Physics</li><li>Programming skills</li></ul>',
 'APPLICANT_FOUND', '2025-09-15', '2025-01-10 13:00:00', '2025-03-15 15:00:00'),

-- Research Group 6 (5 jobs)
('00000000-0000-0000-0000-000000020026', '11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Electrical Engineering', 'Analog Circuits', 'MUNICH', 30, 3, 'INDUSTRY_SPONSORED', 'Circuit Design Internship',
 '<p>Work on analog circuit design and testing for sensor applications.</p>',
 '<ul><li>Design circuits</li><li>Simulate performance</li><li>Test prototypes</li></ul>',
 '<ul><li>Bachelor in EE</li><li>Circuit theory knowledge</li></ul>',
 'PUBLISHED', '2025-09-01', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),

('00000000-0000-0000-0000-000000020027', '11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Electrical Engineering', 'Power Systems', 'HEILBRONN', NULL, NULL, 'RESEARCH_GRANT', 'Smart Grid Research',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 11:30:00', '2025-02-10 11:30:00'),

('00000000-0000-0000-0000-000000020028', '11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Electrical Engineering', 'Signal Processing', 'HEILBRONN', 35, 3, 'INDUSTRY_SPONSORED', 'Signal Processing Researcher',
 '<p>Develop low-power signal processing pipelines for embedded systems.</p>',
 '<ul><li>Algorithm development</li><li>Simulations</li><li>Hardware testing</li></ul>',
 '<ul><li>Master in EE</li><li>MATLAB or Python experience</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-20 14:00:00', '2025-01-25 16:00:00'),

('00000000-0000-0000-0000-000000020029', '11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Electrical Engineering', 'Robotics', 'MUNICH', 35, 3, 'INDUSTRY_SPONSORED', 'Robot Arm Control Developer',
 '<p>Develop control software for collaborative robotic arms.</p>',
 '<ul><li>Simulate motion</li><li>Test control loops</li><li>Write documentation</li></ul>',
 '<ul><li>CS, Mechatronics or Mech Eng MSc</li><li>Control theory knowledge</li></ul>',
 'CLOSED', '2025-07-01', '2025-01-05 09:00:00', '2025-06-30 10:00:00'),

('00000000-0000-0000-0000-000000020030', '11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'Electrical Engineering', 'Embedded Systems', 'MUNICH', 30, 2, 'RESEARCH_GRANT', 'Embedded Systems Researcher',
 '<p>Develop energy-efficient embedded systems for IoT applications.</p>',
 '<ul><li>Design firmware</li><li>Optimize power consumption</li><li>Test prototypes</li></ul>',
 '<ul><li>MSc in EE or CS</li><li>Embedded programming experience</li></ul>',
 'APPLICANT_FOUND', '2025-09-15', '2025-01-10 13:00:00', '2025-03-15 15:00:00'),

-- Research Group 7 (5 jobs)
('00000000-0000-0000-0000-000000020031', '11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'Biology', 'Genetics', 'WEIHENSTEPHAN', 20, 2, 'SCHOLARSHIP', 'Genetics Research Intern',
 '<p>Assist in wet-lab DNA sequencing and analysis.</p>',
 '<ul><li>Run PCR</li><li>Log data</li><li>Assist postdocs</li></ul>',
 '<ul><li>BSc or MSc Biology</li><li>Lab experience preferred</li></ul>',
 'PUBLISHED', '2025-09-01', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),

('00000000-0000-0000-0000-000000020032', '11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'Biology', 'Synthetic Biology', 'HEILBRONN', NULL, NULL, 'SCHOLARSHIP', 'Synthetic Gene Circuit Designer',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 11:30:00', '2025-02-10 11:30:00'),

('00000000-0000-0000-0000-000000020033', '11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'Biotechnology', 'Bioinformatics', 'WEIHENSTEPHAN', 25, 2, 'FULLY_FUNDED', 'Genome Data Mining Researcher',
 '<p>Analyze large-scale genomic datasets to identify patterns.</p>',
 '<ul><li>Use BioPython</li><li>Apply statistics</li><li>Contribute to publications</li></ul>',
 '<ul><li>Bioinformatics or related MSc</li><li>Programming skills</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-20 14:00:00', '2025-01-25 16:00:00'),

('00000000-0000-0000-0000-000000020034', '11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'Biochemistry', 'Drug Design', 'WEIHENSTEPHAN', 35, 3, 'SCHOLARSHIP', 'Drug Synthesis Research Position',
 '<p>Research new synthesis pathways for antibiotics and other drugs.</p>',
 '<ul><li>Organic chemistry</li><li>Lab safety</li><li>Documentation</li></ul>',
 '<ul><li>Chemistry MSc required</li><li>Synthesis experience</li></ul>',
 'CLOSED', '2025-07-01', '2025-01-05 09:00:00', '2025-06-30 10:00:00'),

('00000000-0000-0000-0000-000000020035', '11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'Life Sciences', 'Molecular Biology', 'WEIHENSTEPHAN', 25, 2, 'RESEARCH_GRANT', 'Molecular Lab Intern',
 '<p>Support gene expression experiments and analysis.</p>',
 '<ul><li>Pipetting</li><li>Gel electrophoresis</li><li>Lab notebooks</li></ul>',
 '<ul><li>BSc in Biology or related</li><li>Attention to detail</li></ul>',
 'APPLICANT_FOUND', '2025-09-15', '2025-01-10 13:00:00', '2025-03-15 15:00:00'),

-- Research Group 8 (5 jobs)
('00000000-0000-0000-0000-000000020036', '11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', 'Mechanical Engineering', 'Fluid Mechanics', 'STRAUBING', 30, 4, 'FULLY_FUNDED', 'Research Assistant in Fluid Dynamics',
 '<p>Model turbulent flows in pipe systems for industrial applications.</p>',
 '<ul><li>Simulate flows</li><li>Compare models</li><li>Write papers</li></ul>',
 '<ul><li>Master in MechE or Physics</li><li>CFD experience</li></ul>',
 'PUBLISHED', '2025-09-15', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),

('00000000-0000-0000-0000-000000020037', '11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', 'Mechanical Engineering', 'Thermodynamics', 'HEILBRONN', NULL, NULL, 'SCHOLARSHIP', 'Heat Engine Design Intern',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 11:30:00', '2025-02-10 11:30:00'),

('00000000-0000-0000-0000-000000020038', '11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', 'Mechanical Engineering', 'CFD Modeling', 'STRAUBING', 40, 3, 'FULLY_FUNDED', 'Research Position in CFD',
 '<p>Simulate turbulent flows using computational fluid dynamics.</p>',
 '<ul><li>Use OpenFOAM</li><li>Run simulations</li><li>Report results</li></ul>',
 '<ul><li>MSc in Mech/Aero Eng</li><li>CFD background</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-20 14:00:00', '2025-01-25 16:00:00'),

('00000000-0000-0000-0000-000000020039', '11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', 'Aerospace Engineering', 'Hypersonic Flight', 'MUNICH', 40, 5, 'INDUSTRY_SPONSORED', 'Hypersonic Aerodynamics Research',
 '<p>Simulate flight dynamics at Mach 5+ for next-gen aircraft.</p>',
 '<ul><li>Wind tunnel testing</li><li>CFD analysis</li><li>Reporting</li></ul>',
 '<ul><li>MSc in Aero or Mechanical Engineering</li><li>CFD experience</li></ul>',
 'CLOSED', '2025-07-01', '2025-01-05 09:00:00', '2025-06-30 10:00:00'),

('00000000-0000-0000-0000-000000020040', '11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', 'Energy Systems', 'Hydrogen Storage', 'STRAUBING', 30, 3, 'FULLY_FUNDED', 'Hydrogen Storage Researcher',
 '<p>Investigate metal hydrides for energy storage applications.</p>',
 '<ul><li>Material testing</li><li>Simulations</li><li>Analysis</li></ul>',
 '<ul><li>Materials Sci or Chem Eng MSc</li><li>Research experience</li></ul>',
 'APPLICANT_FOUND', '2025-09-15', '2025-01-10 13:00:00', '2025-03-15 15:00:00'),

-- Research Group 9 (5 jobs)
('00000000-0000-0000-0000-000000020041', '11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'Urban Planning', 'Green Infrastructure', 'GARCHING_HOCHBRUECK', 25, 2, 'FULLY_FUNDED', 'Smart Green City Intern',
 '<p>Design sustainable urban green spaces using data-driven approaches.</p>',
 '<ul><li>GIS tools</li><li>Planning</li><li>Stakeholder interviews</li></ul>',
 '<ul><li>Bachelor/Master in Urban Design</li><li>GIS experience</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),

('00000000-0000-0000-0000-000000020042', '11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'Architecture', 'Sustainable Urbanism', 'HEILBRONN', NULL, NULL, 'SELF_FUNDED', 'Assistant in Built Environment',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-10 11:30:00', '2025-02-10 11:30:00'),

('00000000-0000-0000-0000-000000020043', '11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'Geosciences', 'Earthquake Monitoring', 'HEILBRONN', 25, 3, 'PARTIALLY_FUNDED', 'Seismology Research Assistant',
 '<p>Develop early-warning models for seismic events.</p>',
 '<ul><li>Analyze data streams</li><li>Develop alerts</li><li>Test models</li></ul>',
 '<ul><li>Geo or Physics MSc</li><li>Data analysis skills</li></ul>',
 'PUBLISHED', '2025-09-01', '2025-01-20 14:00:00', '2025-01-25 16:00:00'),

('00000000-0000-0000-0000-000000020044', '11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'Urban Planning', 'Green Infrastructure', 'GARCHING_HOCHBRUECK', 25, 2, 'FULLY_FUNDED', 'Urban Green Resilience Intern',
 '<p>Contribute to the design of climate-resilient urban green spaces through a participatory and data-driven approach.</p>',
 '<ul><li>Conduct climate impact assessments for urban areas</li><li>Develop green infrastructure design alternatives</li><li>Facilitate participatory workshops</li></ul>',
 '<ul><li>Background in Urban Ecology, Planning, or Landscape Architecture</li><li>Strong communication and design skills</li></ul>',
 'CLOSED', '2025-07-01', '2025-01-05 09:00:00', '2025-06-30 10:00:00'),

('00000000-0000-0000-0000-000000020045', '11111111-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', 'Geosciences', 'Remote Sensing', 'GARCHING', 30, 2, 'GOVERNMENT_FUNDED', 'Remote Sensing Research Assistant',
 '<p>Analyze satellite imagery for environmental monitoring applications.</p>',
 '<ul><li>Process imagery</li><li>Use GIS tools</li><li>Produce reports</li></ul>',
 '<ul><li>MSc in Geoinformatics, Earth Sciences</li><li>Remote sensing experience</li></ul>',
 'APPLICANT_FOUND', '2025-09-15', '2025-01-10 13:00:00', '2025-03-15 15:00:00'),

-- Research Group 10 (5 jobs)
('00000000-0000-0000-0000-000000020046', '11111111-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Environmental Science', 'Carbon Capture', 'HEILBRONN', 40, 3, 'GOVERNMENT_FUNDED', 'Carbon Capture Researcher',
 '<p>Develop sustainable CO₂ capture materials for industrial applications.</p>',
 '<ul><li>Conduct lab experiments</li><li>Analyze results</li><li>Prepare reports</li></ul>',
 '<ul><li>Chemistry/Materials MSc</li><li>Lab experience</li></ul>',
 'PUBLISHED', '2025-11-01', '2025-01-20 10:30:00', '2025-01-20 10:30:00'),

('00000000-0000-0000-0000-000000020047', '11111111-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Agricultural Science', 'Precision Irrigation', 'HEILBRONN', NULL, NULL, 'RESEARCH_GRANT', 'Irrigation Modeling Research',
 NULL, NULL, NULL,
 'DRAFT', NULL, '2025-02-25 16:45:00', '2025-02-25 16:45:00'),

('00000000-0000-0000-0000-000000020048', '11111111-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Environmental Chemistry', 'Microplastic Pollution', 'HEILBRONN', 30, 3, 'SCHOLARSHIP', 'Microplastics Research Intern',
 '<p>Analyze plastic residues in water and soil samples from agricultural areas.</p>',
 '<ul><li>Collect field samples</li><li>Perform lab analysis</li><li>Process data</li></ul>',
 '<ul><li>EnvSci, Chem, or Biotech BSc/MSc</li><li>Lab skills</li></ul>',
 'PUBLISHED', '2025-10-01', '2025-01-15 14:20:00', '2025-01-18 11:10:00'),

('00000000-0000-0000-0000-000000020049', '11111111-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Environmental Law', 'Climate Policy', 'MUNICH', 20, 2, 'GOVERNMENT_FUNDED', 'Legal Researcher in Climate Law',
 '<p>Evaluate international climate agreements and their implementation.</p>',
 '<ul><li>Conduct legal reviews</li><li>Comparative analysis</li><li>Prepare reports</li></ul>',
 '<ul><li>Law MSc</li><li>English proficiency</li></ul>',
 'CLOSED', '2025-11-01', '2025-01-10 09:45:00', '2025-06-30 15:00:00'),

('00000000-0000-0000-0000-000000020050', '11111111-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000010', 'Biomedical Engineering', 'Prosthetics', 'MUNICH', 40, 4, 'GOVERNMENT_FUNDED', 'Researcher: Soft Robotics for Prosthetics',
 '<p>Design and test soft robotic prosthetic limbs for improved mobility.</p>',
 '<ul><li>Material design</li><li>Electronics integration</li><li>User testing</li></ul>',
 '<ul><li>MSc in Biomed or Mech Eng</li><li>Robotics experience</li></ul>',
 'APPLICANT_FOUND', '2025-11-01', '2025-01-30 13:15:00', '2025-03-05 10:45:00');
