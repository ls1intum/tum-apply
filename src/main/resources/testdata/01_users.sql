-- =============================================
-- 01_users.sql
-- Inserts example users
-- Preconditions:
--   - No foreign key constraints violated (research_groups will be inserted later)
--   - avatar_file_id, cv_file_id, bachelor_certificate_id, master_certificate_id may be NULL
-- =============================================
-- Clean up existing users
DELETE FROM users
WHERE user_id LIKE '00000000-0000-0000-0000-0000000001%'
  OR user_id LIKE '11111111-0000-0000-0000-%';

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
        ('00000000-0000-0000-0000-000000000101', NULL, 'admin1@tumapply.local', NULL, 'System', 'Admin', NULL, 'de', NULL, NULL, NULL, NULL, 'en'),
        ('00000000-0000-0000-0000-000000000102', NULL, 'professor1@tumapply.local', NULL, 'Anna', 'Professorin', 'female', 'de', '1990-01-01', '+49123456789', 'https://ai.tum.de', NULL, 'de'),
        ('00000000-0000-0000-0000-000000000103', NULL, 'applicant1@tumapply.local', NULL, 'Max', 'Applicant', 'male', 'de', '1999-05-26', '+49123456789', NULL, 'https://linkedin.com/in/max', 'de'),
        ('00000000-0000-0000-0000-000000000104', NULL, 'external@uni.de', NULL, 'Sara', 'Extern', 'female', 'de', '1995-12-31', NULL, NULL, NULL, 'en'),
        ('00000000-0000-0000-0000-000000000105', NULL, 'professor2@tum.de', NULL, 'Professor2', 'TUM', NULL, NULL, NULL, NULL, NULL, NULL, 'en'),
        ('00000000-0000-0000-0000-000000000106', NULL, 'longnameperson@intl.edu', NULL, 'Jean-Pierre-Étienne', 'Van Der Straaten-Sánchez', 'male', 'be', '1975-07-20', '+3225551234', 'https://intl.edu/users/jps', NULL, 'en'),
        ('11111111-0000-0000-0000-000000000001', NULL, 'amelie.bauer@tumapply.local', NULL, 'Amelie', 'Bauer', 'female', 'de', '1993-03-14', '+49 89 99887766', 'https://ameliebauer.dev', 'https://linkedin.com/in/ameliebauer123', 'de'),
        ('11111111-0000-0000-0000-000000000002', NULL, 'daniel.kim@tumapply.local', NULL, 'Daniel', 'Kim', 'male', 'nl', '1987-08-10', '+82 2 777 8888', 'https://danielkim.kr', 'https://linkedin.com/in/danielkim123', 'en'),
        ('11111111-0000-0000-0000-000000000003', NULL, 'lina.zhang@tumapply.local', NULL, 'Lina', 'Zhang', 'female', 'fr', '1992-11-22', '+86 10 1234 5678', 'https://linazhang.cn', 'https://linkedin.com/in/linazhang123', 'en'),
        ('11111111-0000-0000-0000-000000000004', NULL, 'thomas.miller@tumapply.local', NULL, 'Thomas', 'Miller', 'male', 'de', '1985-05-18', '+1 212 555 7890', 'https://thomasmiller.com', 'https://linkedin.com/in/thomasmiller123', 'en'),
        ('11111111-0000-0000-0000-000000000005', NULL, 'sofia.ricci@tumapply.local', NULL, 'Sofia', 'Ricci', 'female', 'nl', '1990-06-25', '+39 06 555 7890', 'https://sofiaricci.it', 'https://linkedin.com/in/sofiaricci123', 'en'),
        ('11111111-0000-0000-0000-000000000006', NULL, 'khalid.hassan@tumapply.local', NULL, 'Khalid', 'Hassan', 'male', 'es', '1988-02-17', '+20 2 12345678', 'https://khalidhassan.com', 'https://linkedin.com/in/khalidhassan123', 'en'),
        ('11111111-0000-0000-0000-000000000007', NULL, 'ines.fernandez@tumapply.local', NULL, 'Ines', 'Fernández', 'female', 'es', '1991-09-11', '+34 91 456 7890', 'https://inesfernandez.es', 'https://linkedin.com/in/inesfernandez123', 'en'),
        ('11111111-0000-0000-0000-000000000008', NULL, 'adam.nowak@tumapply.local', NULL, 'Adam', 'Nowak', 'male', 'pl', '1986-07-04', '+48 22 888 9999', 'https://adamnowak.pl', 'https://linkedin.com/in/adamnowak123', 'en'),
        ('11111111-0000-0000-0000-000000000009', NULL, 'elena.kovalenko@tumapply.local', NULL, 'Elena', 'Kovalenko', 'female', 'de', '1994-10-29', '+380 44 1234567', 'https://elenakovalenko.ua', 'https://linkedin.com/in/elenakovalenko123', 'en'),
        ('11111111-0000-0000-0000-000000000010', NULL, 'jamal.abdi@tumapply.local', NULL, 'Jamal', 'Abdi', 'male', 'tr', '1990-01-09', '+254 20 1112223', 'https://jamalabdi.ke', 'https://linkedin.com/in/jamalabdi123', 'en'),
        ('11111111-0000-0000-0000-000000000011', NULL, 'sophie.lee@tumapply.local', NULL, 'Sophie', 'Lee', 'female', 'md', '1993-05-01', '+65 6123 4567', 'https://sophielee.sg', 'https://linkedin.com/in/sophielee123', 'en'),
        ('11111111-0000-0000-0000-000000000012', NULL, 'hassan.mohammed@tumapply.local', NULL, 'Hassan', 'Mohammed', 'male', 'tr', '1987-03-03', '+966 11 1234567', 'https://hassanmohammed.sa', 'https://linkedin.com/in/hassanmohammed123', 'en'),
        ('11111111-0000-0000-0000-000000000013', NULL, 'tatiana.ivanova@tumapply.local', NULL, 'Tatiana', 'Ivanova', 'female', 'ua', '1989-04-04', '+7 495 1234567', 'https://tatianaivanova.ru', 'https://linkedin.com/in/tatianaivanova123', 'en'),
        ('11111111-0000-0000-0000-000000000014', NULL, 'jacob.green@tumapply.local', NULL, 'Jacob', 'Green', 'male', 'tr', '1991-12-12', '+1 416 1234567', 'https://jacobgreen.ca', 'https://linkedin.com/in/jacobgreen123', 'en'),
        ('11111111-0000-0000-0000-000000000015', NULL, 'li.hua@tumapply.local', NULL, 'Li', 'Hua', 'female', 'fr', '1995-06-06', '+86 21 12345678', 'https://lihua.cn', 'https://linkedin.com/in/lihua123', 'en'),
        ('11111111-0000-0000-0000-000000000016', NULL, 'julia.martin@tumapply.local', NULL, 'Julia', 'Martin', 'female', 'fr', '1992-02-02', '+33 1 23456789', 'https://juliamartin.fr', 'https://linkedin.com/in/juliamartin123', 'en'),
        ('11111111-0000-0000-0000-000000000017', NULL, 'ahmad.rahman@tumapply.local', NULL, 'Ahmad', 'Rahman', 'male', 'de', '1990-07-21', '+880 2 123456', 'https://ahmadrahman.bd', 'https://linkedin.com/in/ahmadrahman123', 'en'),
        ('11111111-0000-0000-0000-000000000018', NULL, 'lucy.taylor@tumapply.local', NULL, 'Lucy', 'Taylor', 'female', 'de', '1988-10-10', '+44 161 1234567', 'https://lucytaylor.uk', 'https://linkedin.com/in/lucytaylor123', 'en'),
        ('11111111-0000-0000-0000-000000000019', NULL, 'leon.schmidt@tumapply.local', NULL, 'Leon', 'Schmidt', 'male', 'de', '1985-11-11', '+49 30 9876543', 'https://leonschmidt.de', 'https://linkedin.com/in/leonschmidt123', 'de'),
        ('11111111-0000-0000-0000-000000000020', NULL, 'nina.petrova@tumapply.local', NULL, 'Nina', 'Petrova', 'female', 'ua', '1993-08-08', '+7 812 1234567', 'https://ninapetrova.ru', 'https://linkedin.com/in/ninapetrova123', 'en'),
        ('11111111-0000-0000-0000-000000000021', NULL, 'george.mensah@tumapply.local', NULL, 'George', 'Mensah', 'male', 'pl', '1987-04-14', '+233 302 123456', 'https://georgemensah.gh', 'https://linkedin.com/in/georgemensah123', 'en'),
        ('11111111-0000-0000-0000-000000000022', NULL, 'eva.fischer@tumapply.local', NULL, 'Eva', 'Fischer', 'female', 'de', '1990-12-03', '+49 89 4445556', 'https://evafischer.de', 'https://linkedin.com/in/evafischer123', 'de'),
        ('11111111-0000-0000-0000-000000000023', NULL, 'jay.patel@tumapply.local', NULL, 'Jay', 'Patel', 'male', 'no', '1994-05-17', '+91 22 87654321', 'https://jaypatel.in', 'https://linkedin.com/in/jaypatel123', 'en'),
        ('11111111-0000-0000-0000-000000000024', NULL, 'olga.smirnova@tumapply.local', NULL, 'Olga', 'Smirnova', 'female', 'ua', '1992-01-15', '+7 343 123456', 'https://olgasmirnova.ru', 'https://linkedin.com/in/olgasmirnova123', 'en'),
        ('11111111-0000-0000-0000-000000000025', NULL, 'karim.saad@tumapply.local', NULL, 'Karim', 'Saad', 'male', 'es', '1989-09-09', '+20 2 11223344', 'https://karimsaad.eg', 'https://linkedin.com/in/karimsaad123', 'en'),
        ('11111111-0000-0000-0000-000000000026', NULL, 'meera.iyer@tumapply.local', NULL, 'Meera', 'Iyer', 'female', 'no', '1996-03-03', '+91 80 33445566', 'https://meera.in', 'https://linkedin.com/in/meera123', 'en'),
        ('11111111-0000-0000-0000-000000000027', NULL, 'erik.olsen@tumapply.local', NULL, 'Erik', 'Olsen', 'male', 'no', '1986-06-06', '+46 8 123456', 'https://erikolsen.se', 'https://linkedin.com/in/erikolsen123', 'en'),
        ('11111111-0000-0000-0000-000000000028', NULL, 'claire.lambert@tumapply.local', NULL, 'Claire', 'Lambert', 'female', 'fr', '1988-08-08', '+33 1 456789', 'https://clairelambert.fr', 'https://linkedin.com/in/clairelambert123', 'en'),
        ('11111111-0000-0000-0000-000000000029', NULL, 'matteo.rinaldi@tumapply.local', NULL, 'Matteo', 'Rinaldi', 'male', 'nl', '1991-07-07', '+39 02 123456', 'https://matteorinaldi.it', 'https://linkedin.com/in/matteorinaldi123', 'en'),
        ('11111111-0000-0000-0000-000000000030', NULL, 'noor.ahmed@tumapply.local', NULL, 'Noor', 'Ahmed', 'female', 'fr', '1995-02-02', '+92 42 1234567', 'https://noorahmed.pk', 'https://linkedin.com/in/noorahmed123', 'en');
