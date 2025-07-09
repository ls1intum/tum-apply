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
                   start_date)
VALUES
-- Job 1
('00000000-0000-0000-0000-000000020001','11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Data Science','Deep Learning','MUNICH',40,3,'FULLY_FUNDED','Researcher in Deep Learning','Join our cutting-edge research in neural networks.','Develop new architectures, test models, publish results.','Master in CS, strong Python/ML skills.','PUBLISHED','2025-09-01'),
-- Job 2
('00000000-0000-0000-0000-000000020002','11111111-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','Mathematics','Theoretical Computer Science','GARCHING',30,2,'SCHOLARSHIP','Research Assistant in Algorithms','Study complexity and optimization problems.','Collaborate on theory papers, develop proofs.','Bachelor or Master in Mathematics/CS.','APPLICANT_FOUND','2025-10-01'),
-- Job 3 (draft)
('00000000-0000-0000-0000-000000020003','11111111-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005',NULL,NULL,'SINGAPORE',NULL,NULL,'RESEARCH_GRANT','Quantum Research Intern',NULL,NULL,NULL,'DRAFT',NULL),
-- Job 4
('00000000-0000-0000-0000-000000020004','11111111-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000006','Electrical Engineering','Signal Processing','HEILBRONN',35,3,'INDUSTRY_SPONSORED','Research on Next-Gen Radar Systems','Develop low-power radar signal processing pipelines.','Simulations, algorithm design, testing.','Master in EE, experience in MATLAB or Python.','PUBLISHED','2025-10-01'),
-- Job 5 (closed)
('00000000-0000-0000-0000-000000020005','11111111-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000007','Biology','Genetics','WEIHENSTEPHAN',20,2,'SCHOLARSHIP','Genetics Research Intern','Assist in wet-lab DNA sequencing.','Run PCR, log data, assist postdocs.','BSc or MSc Biology.','CLOSED','2025-07-01'),
-- Job 6
('00000000-0000-0000-0000-000000020006','11111111-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008','Mechanical Engineering','Fluid Mechanics','STRAUBING',30,4,'FULLY_FUNDED','Research Assistant in Fluid Dynamics','Model turbulent flows in pipe systems.','Simulate, compare models, write papers.','Master in MechE or Physics.','PUBLISHED','2025-09-15'),
-- Job 7
('00000000-0000-0000-0000-000000020007','11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000009','Architecture','Sustainable Urbanism','MUNICH',40,3,'GOVERNMENT_FUNDED','Urban Sustainability Research Assistant','Analyze city growth and emissions.','Data analysis, case studies, planning tools.','Master in Architecture, Urban Planning, or Geo Info Systems.','PUBLISHED','2025-08-01'),
-- Job 8 (draft)
('00000000-0000-0000-0000-000000020008','11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000009',NULL,NULL,'GARCHING',NULL,NULL,'SELF_FUNDED','Assistant in Built Environment',NULL,NULL,NULL,'DRAFT',NULL),
-- Job 9
('00000000-0000-0000-0000-000000020009','11111111-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Agricultural Science','Precision Irrigation','STRAUBING',30,3,'RESEARCH_GRANT','Irrigation Modeling Research','Optimize water use in crops via data models.','Remote sensing, GIS mapping, modeling.','MSc in AgriSci, EnvEng or CS with agri experience.','PUBLISHED','2025-10-01'),
-- Job 10
('00000000-0000-0000-0000-000000020010','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','Informatics','Gamified Learning','GARCHING',20,1,'SCHOLARSHIP','Gamification in Education Intern', '<p><strong>Join our interdisciplinary team</strong> working on next-gen gamified learning tools in higher education. This role supports research in human-computer interaction (HCI), behavioral science, and UX design.</p><p>You will contribute to designing playful, motivating, and effective learning experiences for university students.</p>', '<ul><li>Design and prototype interactive game elements</li><li>Conduct user surveys and usability testing</li><li>Analyze engagement data to inform design choices</li></ul>', '<ul><li>Enrolled in B.Sc. program in HCI, Psychology, Computer Science, or related field</li><li>Interest in gamification and digital education</li><li>Basic knowledge of user research and design tools (e.g., Figma, Qualtrics)</li></ul>','PUBLISHED','2025-10-01'),
-- Job 11
('00000000-0000-0000-0000-000000020011','11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Computer Vision','Medical Imaging','GARCHING',40,3,'INDUSTRY_SPONSORED','Medical Image Analysis Research','Work on diagnostic AI tools using imaging data.','Deep learning, annotation, publication.','MSc in CS, experience with PyTorch.','PUBLISHED','2025-09-15'),
-- Job 12
('00000000-0000-0000-0000-000000020012','11111111-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','Mathematics','Cryptography','MUNICH',30,2,'GOVERNMENT_FUNDED','Research Assistant in Quantum-Safe Cryptography','Research post-quantum algorithms.','Formal proofs, protocol design.','MSc in Math, CS, or related.','PUBLISHED','2025-10-01'),
-- Job 13
('00000000-0000-0000-0000-000000020013','11111111-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005','Physics','Plasma Physics','GARCHING_HOCHBRUECK',40,4,'RESEARCH_GRANT','Fusion Research Support','Support modeling and diagnostics for fusion reactors.','Simulations, lab support.','MSc in Physics, coding skills.','PUBLISHED','2025-08-15'),
-- Job 14
('00000000-0000-0000-0000-000000020014','11111111-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000006','EE','Analog Circuits','MUNICH',30,3,'INDUSTRY_SPONSORED','Circuit Design Internship','Analog layout and testing.','Hands-on circuit experience.','Bachelor in EE.','CLOSED','2025-07-01'),
-- Job 15
('00000000-0000-0000-0000-000000020015','11111111-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000007','Biotechnology','Bioinformatics','WEIHENSTEPHAN',25,2,'FULLY_FUNDED','Genome Data Mining Researcher','Analyze large-scale genomic datasets.','BioPython, statistics, publications.','Bioinformatics or related MSc.','PUBLISHED','2025-09-01'),
-- Job 16
('00000000-0000-0000-0000-000000020016','11111111-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008','Mechanical Engineering','Thermodynamics','STRAUBING',20,2,'SCHOLARSHIP','Heat Engine Design Intern','Simulation of alternative energy systems.','Modeling, data analysis.','BSc/MSc MechE.','PUBLISHED','2025-10-01'),
-- Job 17
('00000000-0000-0000-0000-000000020017','11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000009','Urban Planning','Green Infrastructure','GARCHING_HOCHBRUECK',25,2,'FULLY_FUNDED','Smart Green City Intern','Design sustainable urban green spaces.','GIS tools, planning, stakeholder interviews.','Bachelor/Master in Urban Design.','APPLICANT_FOUND','2025-10-01'),
-- Job 18
('00000000-0000-0000-0000-000000020018','11111111-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Environmental Science','Carbon Capture','HEILBRONN',40,3,'GOVERNMENT_FUNDED','Carbon Capture Researcher','Develop sustainable CO₂ capture materials.','Lab work, analysis, reporting.','Chemistry/Materials MSc.','PUBLISHED','2025-11-01'),
-- Job 19
('00000000-0000-0000-0000-000000020019','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','Informatics','Educational Technology','GARCHING',NULL,NULL,'RESEARCH_GRANT','Learning Analytics Researcher','Analyze digital learning data to optimize student outcomes.','Data cleaning, statistical analysis, reporting.','MSc in CS, EdTech, or related.','DRAFT',NULL),
-- Job 20
('00000000-0000-0000-0000-000000020020','11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Data Science','Data Privacy','MUNICH',40,3,'RESEARCH_GRANT','Privacy-Preserving ML','Explore federated and encrypted learning.','Protocol design, implementation.','MSc in DS, CS, Math.','CLOSED','2025-09-01'),
-- Job 21
('00000000-0000-0000-0000-000000020021','11111111-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','Cybersecurity','Penetration Testing','MUNICH',30,2,'FULLY_FUNDED','Security Analyst Position','Conduct internal security audits and vulnerability scans.','Ethical hacking, reporting, mitigation strategies.','BSc/MSc in IT Security or CS.','PUBLISHED','2025-10-01'),
-- Job 22
('00000000-0000-0000-0000-000000020022','11111111-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005','Civil Engineering','Structural Health Monitoring','GARCHING',40,4,'RESEARCH_GRANT','Bridge Monitoring Researcher','Monitor bridge stress data using sensors.','Deploy systems, analyze datasets.','MSc in Civil/Mechanical Eng.','PUBLISHED','2025-11-15'),
-- Job 23
('00000000-0000-0000-0000-000000020023','11111111-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000006','Mechatronics','Robot Kinematics','STRAUBING',20,3,'PARTIALLY_FUNDED','Student Position: Arm Kinematics','Test low-cost robot arm designs.','Prototype building, testing, reports.','Bachelor in Mechatronics or EE.','PUBLISHED','2025-09-01'),
-- Job 24
('00000000-0000-0000-0000-000000020024','11111111-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000007','Biochemistry','Drug Design','WEIHENSTEPHAN',35,3,'SCHOLARSHIP','Drug Synthesis Research Position','Research new synthesis pathways for antibiotics.','Organic chemistry, lab safety, documentation.','Chemistry MSc required.','PUBLISHED','2025-10-01'),
-- Job 25
('00000000-0000-0000-0000-000000020025','11111111-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008','Aerospace Engineering','Hypersonic Flight','MUNICH',40,5,'INDUSTRY_SPONSORED','Hypersonic Aerodynamics Research','Simulate flight dynamics at Mach 5+.','Wind tunnel testing, CFD, reporting.','MSc in Aero or Mechanical Engineering.','PUBLISHED','2025-09-01'),
-- Job 26
('00000000-0000-0000-0000-000000020026','11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000009','Urban Planning','Green Infrastructure','GARCHING_HOCHBRUECK',25,2,'FULLY_FUNDED','Smart Green City Intern','Design sustainable urban green spaces.','GIS tools, planning, stakeholder interviews.','Bachelor/Master in Urban Design.','PUBLISHED','2025-10-01'),
-- Job 27
('00000000-0000-0000-0000-000000020027','11111111-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Biomedical Engineering','Prosthetics','MUNICH',40,4,'GOVERNMENT_FUNDED','Researcher: Soft Robotics for Prosthetics','Design and test soft robotic prosthetic limbs.','Material design, electronics, user testing.','MSc in Biomed or Mech Eng.','PUBLISHED','2025-11-01'),
-- Job 28
('00000000-0000-0000-0000-000000020028','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','Informatics','AI in Classrooms','MUNICH',35,2,'FULLY_FUNDED','AI Teaching Assistant Developer','Develop AI bots to assist educators in digital platforms.','Chatbot design, evaluation.','MSc in AI, NLP, or HCI.','PUBLISHED','2025-09-15'),
-- Job 29
('00000000-0000-0000-0000-000000020029','11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Software Engineering','Formal Verification','SINGAPORE',30,2,'RESEARCH_GRANT','Verification Tools Research Assistant','Develop formal models and proofs.','Use tools like Isabelle or Coq.','CS or Math MSc.','PUBLISHED','2025-10-01'),
-- Job 30
('00000000-0000-0000-0000-000000020030','11111111-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','Information Systems','Process Mining','MUNICH',20,2,'INDUSTRY_SPONSORED','Process Analyst','Analyze ERP logs for optimization.','Process models, automation.','Business Informatics or CS MSc.','PUBLISHED','2025-10-01'),
-- Job 31
('00000000-0000-0000-0000-000000020031','11111111-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005','Mechanical Engineering','CFD Modeling','STRAUBING',40,3,'FULLY_FUNDED','Research Position IN Computational Fluid Dynamics','Simulate turbulent flows.','Use OpenFOAM, report results.','MSc in Mech/Aero Eng.','APPLICANT_FOUND','2025-09-15'),
-- Job 32
('00000000-0000-0000-0000-000000020032','11111111-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000006','Industrial Design','User-Centered Design','GARCHING',20,1,'SELF_FUNDED','Design Intern','Support UX research and prototyping.','Figma, user testing, sketches.','BSc Design or UX.','APPLICANT_FOUND','2025-09-01'),
-- Job 33
('00000000-0000-0000-0000-000000020033','11111111-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000007','Biology','Synthetic Biology','GARCHING',30,2,'SCHOLARSHIP','Synthetic Gene Circuit Designer','Engineer biological logic gates.','Wet lab, modeling.','Biology or Biotech MSc.','PUBLISHED','2025-10-01'),
-- Job 34
('00000000-0000-0000-0000-000000020034','11111111-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008','Chemical Engineering','Catalysis','MUNICH',40,3,'RESEARCH_GRANT','Catalyst Efficiency Researcher','Test heterogeneous catalysts.','Spectroscopy, analysis.','Chem Eng MSc.','PUBLISHED','2025-08-15'),
-- Job 35
('00000000-0000-0000-0000-000000020035','11111111-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000009','Geosciences','Earthquake Monitoring','HEILBRONN',25,3,'PARTIALLY_FUNDED','Seismology Research Assistant','Develop early-warning models.','Data streams, alerts.','Geo or Physics MSc.','PUBLISHED','2025-09-01'),
-- Job 36
('00000000-0000-0000-0000-000000020036','11111111-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Environmental Law','Climate Policy','MUNICH',20,2,'GOVERNMENT_FUNDED','Legal Researcher in Climate Law','Evaluate international climate agreements.','Legal reviews, comparative analysis.','Law MSc, English proficiency.','PUBLISHED','2025-11-01'),
-- Job 37
('00000000-0000-0000-0000-000000020037','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','Informatics','Interactive Platforms','GARCHING',30,2,'SELF_FUNDED','EdTech Interface Designer','Design and evaluate learning UIs.','Figma, usability studies.','Design or HCI student.','PUBLISHED','2025-11-01'),
-- Job 38
('00000000-0000-0000-0000-000000020038','11111111-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','Statistics','Bayesian Modeling','MUNICH',30,3,'RESEARCH_GRANT','Bayesian Networks Researcher','Model uncertainty in complex systems.','Inference, MCMC methods.','Math or Stats MSc.','PUBLISHED','2025-10-01'),
-- Job 39
('00000000-0000-0000-0000-000000020039','11111111-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','Informatics','Natural Interfaces','SINGAPORE',20,1,'SELF_FUNDED','Tangible Interfaces Intern','Build interfaces using physical objects.','Arduino, rapid prototyping.','CS or Design student.','PUBLISHED','2025-09-01'),
-- Job 40
('00000000-0000-0000-0000-000000020040','11111111-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000005','Geoinformatics','Remote Sensing','GARCHING',30,2,'GOVERNMENT_FUNDED','Remote Sensing Research Assistant','Analyze satellite imagery for environmental monitoring.','Process imagery, use GIS tools, produce reports.','MSc in Geoinformatics, Earth Sciences, or related.','PUBLISHED','2025-09-01'),
-- Job 41
('00000000-0000-0000-0000-000000020041','11111111-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000006','Mechanical Engineering','Robotics','MUNICH',35,3,'INDUSTRY_SPONSORED','Robot Arm Control Developer','Develop control software for collaborative robotic arms.','Simulate motion, test control loops, write documentation.','CS, Mechatronics or Mech Eng MSc.','PUBLISHED','2025-10-01'),
-- Job 42
('00000000-0000-0000-0000-000000020042','11111111-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000007','Life Sciences','Molecular Biology','WEIHENSTEPHAN',25,2,'RESEARCH_GRANT','Molecular Lab Intern','Support gene expression experiments.','Pipetting, gel electrophoresis, lab notebooks.','BSc in Biology or related.','PUBLISHED','2025-09-15'),
-- Job 43
('00000000-0000-0000-0000-000000020043','11111111-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008','Energy Systems','Hydrogen Storage','STRAUBING',30,3,'FULLY_FUNDED','Hydrogen Storage Researcher','Investigate metal hydrides for energy storage.','Material testing, simulations.','Materials Sci or Chem Eng MSc.','PUBLISHED','2025-10-01'),
-- Job 44
('00000000-0000-0000-0000-000000020044','00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000002','Data Science','Time Series Analysis','MUNICH',30,2,'RESEARCH_GRANT','Time Series Forecasting Intern','Predict trends using large-scale time-series data.','Implement ARIMA/LSTM models.','CS or Statistics MSc.','PUBLISHED','2025-09-01'),
-- Job 45
('00000000-0000-0000-0000-000000020045','11111111-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','Environmental Chemistry','Microplastic Pollution','HEILBRONN',30,3,'SCHOLARSHIP','Microplastics Research Intern','Analyze plastic residues in water and soil.','Field sampling, lab analysis, statistics.','EnvSci, Chem, or Biotech BSc/MSc.','PUBLISHED','2025-10-01'),
-- Job 46
('00000000-0000-0000-0000-000000020046','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','Informatics','Assessment Technology','GARCHING',40,3,'RESEARCH_GRANT','Automated Grading Researcher','Develop automated grading tools for online platforms.','ML modeling, data annotation.','CS or Data Sci MSc.','PUBLISHED','2025-10-15'),
-- Job 47
('00000000-0000-0000-0000-000000020047','00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000002','Data Science','Recommender Systems','MUNICH',25,2,'FULLY_FUNDED','Personalized Recommendation Research','Develop algorithms for personalization.','Matrix factorization, collaborative filtering.','MSc in DS/ML.','PUBLISHED','2025-09-15'),
-- Job 48
('00000000-0000-0000-0000-000000020048','00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000002','Data Science','Ethical AI','MUNICH',20,1,'GOVERNMENT_FUNDED','Bias Detection in ML Models','Detect and mitigate bias in datasets.','Model auditing, fairness metrics.','CS or Ethics MSc.','PUBLISHED','2025-10-01'),
-- Job 49
('00000000-0000-0000-0000-000000020049','00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000002','Data Science','Natural Language Processing','HEILBRONN',40,3,'INDUSTRY_SPONSORED','Multilingual NLP Research','Build NLP models across multiple languages.','Preprocessing, training, testing.','MSc in CS/Linguistics.','PUBLISHED','2025-10-15'),
-- Job 50
('00000000-0000-0000-0000-000000020050','00000000-0000-0000-0000-000000000105','00000000-0000-0000-0000-000000000002','Data Science','Data Visualization','HEILBRONN',30,2,'SCHOLARSHIP','Visual Analytics Research Assistant','Visualize complex datasets for stakeholder use.','D3.js, Tableau, Python.','MSc in DS, HCI, or InfoVis.','PUBLISHED','2025-11-01');
