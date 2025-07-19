-- =============================================
-- 06_applicants.sql
-- Inserts example applicants
-- Preconditions:
--   - users must exist
-- =============================================

-- clean existing data
DELETE
FROM applicants
WHERE user_id IN (
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000106'
);

-- Insert test applicants linked to existing users
REPLACE INTO applicants (
    user_id,
    street,
    postal_code,
    city,
    country,
    bachelor_degree_name,
    bachelor_grading_scale,
    bachelor_grade,
    bachelor_university,
    master_degree_name,
    master_grading_scale,
    master_grade,
    master_university
) VALUES
    ('00000000-0000-0000-0000-000000000103','Gabelsbergerstraße 10','88772','Hamburg','Germany','B.Sc. Physics','ONE_TO_FOUR','3.5','RWTH Aachen','M.Sc. Bioinformatics','ONE_TO_FOUR','2.8','TUM'),
    ('00000000-0000-0000-0000-000000000104','Leopoldstraße 44','82981','Garching','Germany','B.Sc. Biology','ONE_TO_FOUR','1.8','TUM','M.Sc. Robotics','ONE_TO_FOUR','3.6','KIT'),
    ('00000000-0000-0000-0000-000000000106','Mainzer Landstraße 90','86294','Frankfurt','Germany','B.Sc. Electrical Engineering','ONE_TO_FOUR','2.9','LMU','M.Sc. Embedded Systems','ONE_TO_FOUR','1.9','KIT'),
    ('11111111-0000-0000-0000-000000000001','Leopoldstraße 44','80588','Frankfurt','Germany','B.Sc. Electrical Engineering','ONE_TO_FOUR','2.5','Uni Stuttgart','M.Sc. Artificial Intelligence','ONE_TO_FOUR','3.0','LMU'),
    ('11111111-0000-0000-0000-000000000006','Gabelsbergerstraße 10','86736','Munich','Germany','B.Sc. Physics','ONE_TO_FOUR','2.2','TUM','M.Sc. Artificial Intelligence','ONE_TO_FOUR','2.4','LMU'),
    ('11111111-0000-0000-0000-000000000007','Lothstraße 13d','80335','Munich','Germany','B.Sc. Psychology','ONE_TO_FOUR','2.0','Heidelberg University','M.Sc. Data Science','ONE_TO_FOUR','1.7','TUM'),
    ('11111111-0000-0000-0000-000000000011','Theresienstraße 10','80333','Munich','Germany','B.Sc. Mechatronics','ONE_TO_FOUR','2.1','Uni Stuttgart','M.Sc. Robotics','ONE_TO_FOUR','2.3','TUM'),
    ('11111111-0000-0000-0000-000000000012','Sprachstraße 10','80331','Munich','Germany','B.A. English','ONE_TO_FOUR','1.7','LMU','M.A. Computational Linguistics','ONE_TO_FOUR','1.8','TUM'),
    ('11111111-0000-0000-0000-000000000013', 'Lilienstraße 19', '80331', 'Munich', 'Germany', 'B.Sc. Educational Technology', 'ONE_TO_FOUR', '1.7', 'University of Passau', 'M.Sc. Learning Sciences', 'ONE_TO_FOUR', '1.3', 'Technical University of Munich'),
    ('11111111-0000-0000-0000-000000000014','Schellingstraße 4','80799','Munich','Germany','B.Sc. Informatics','ONE_TO_FOUR','1.9','Uni Augsburg','M.Sc. Machine Learning','ONE_TO_FOUR','2.0','TUM'),
    ('11111111-0000-0000-0000-000000000015','Kaiserstraße 12','76133','Karlsruhe','Germany','B.Sc. Civil Engineering','ONE_TO_FOUR','3.1','KIT','M.Sc. Urban Planning','ONE_TO_FOUR','2.5','TUM'),
    ('11111111-0000-0000-0000-000000000016','Luisenstraße 37','80333','Munich','Germany','B.Sc. Digital Humanities','ONE_TO_FOUR','1.5','LMU','M.Sc. Computational Linguistics','ONE_TO_FOUR','1.7','TUM'),
    ('11111111-0000-0000-0000-000000000017','Chemiestraße 21','85748','Garching','Germany','B.Sc. Chemistry','ONE_TO_FOUR','2.6','TUM','M.Sc. Materials Science','ONE_TO_FOUR','2.9','TUM'),
    ('11111111-0000-0000-0000-000000000018','Sprachstraße 10','80331','Munich','Germany','B.A. Linguistics','ONE_TO_FOUR','1.4','LMU','M.A. Computational Linguistics','ONE_TO_FOUR','1.6','TUM'),
    ('11111111-0000-0000-0000-000000000019','Balanstraße 73','81541','Munich','Germany','B.Sc. Mechanical Engineering','ONE_TO_FOUR','2.2','RWTH Aachen','M.Sc. Thermodynamics','ONE_TO_FOUR','2.1','TUM'),
    ('11111111-0000-0000-0000-000000000020','Friedrichstraße 12','10117','Berlin','Germany','B.Sc. Data Science','ONE_TO_FOUR','1.6','TU Berlin','M.Sc. Machine Learning','ONE_TO_FOUR','1.5','TUM'),
    ('11111111-0000-0000-0000-000000000021','Max-Planck-Str. 1','85748','Garching','Germany','B.Sc. Physics','ONE_TO_FOUR','2.0','LMU','M.Sc. Quantum Computing','ONE_TO_FOUR','1.8','TUM'),
    ('11111111-0000-0000-0000-000000000022','Walther-Meißner-Str. 8','85748','Garching','Germany','B.Sc. Biomedical Engineering','ONE_TO_FOUR','1.7','TUM','M.Sc. Neuroprosthetics','ONE_TO_FOUR','1.9','TUM'),
    ('11111111-0000-0000-0000-000000000023','Theresienstraße 90','80333','Munich','Germany','B.Sc. Electrical Engineering','ONE_TO_FOUR','2.4','TU Dresden','M.Sc. Smart Grids','ONE_TO_FOUR','2.2','TUM'),
    ('11111111-0000-0000-0000-000000000024','Karlstraße 45','80333','Munich','Germany','B.Sc. Robotics','ONE_TO_FOUR','2.3','TUM','M.Sc. Human-Robot Interaction','ONE_TO_FOUR','2.0','TUM'),
    ('11111111-0000-0000-0000-000000000025','Lothstraße 34','80335','Munich','Germany','B.Sc. Environmental Science','ONE_TO_FOUR','1.8','TUM','M.Sc. Climate Systems','ONE_TO_FOUR','1.6','TUM'),
    ('11111111-0000-0000-0000-000000000026','Luisenstraße 37','80333','Munich','Germany','B.A. History','ONE_TO_FOUR','2.0','LMU','M.A. Digital Humanities','ONE_TO_FOUR','1.9','TUM'),
    ('11111111-0000-0000-0000-000000000027','Chemiestraße 21','85748','Garching','Germany','B.Sc. Chemistry','ONE_TO_FOUR','2.6','LMU','M.Sc. Nano-Materials','ONE_TO_FOUR','2.4','TUM'),
    ('11111111-0000-0000-0000-000000000028','Sprachstraße 10','80331','Munich','Germany','B.A. Linguistics','ONE_TO_FOUR','1.5','LMU','M.A. NLP','ONE_TO_FOUR','1.7','TUM'),
    ('11111111-0000-0000-0000-000000000029','Hochschulstraße 1','01069','Dresden','Germany','B.Sc. Mathematics','ONE_TO_FOUR','2.1','TU Dresden','M.Sc. Statistics','ONE_TO_FOUR','2.2','TUM'),
    ('11111111-0000-0000-0000-000000000030','Reichenbachstraße 20','80469','Munich','Germany','B.Sc. Informatics','ONE_TO_FOUR','1.9','TUM','M.Sc. Human-Computer Interaction','ONE_TO_FOUR','2.0','TUM');
