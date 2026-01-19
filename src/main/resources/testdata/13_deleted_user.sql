-- =============================================
-- 13_deleted_user.sql
-- Inserts a dummy "deleted user" placeholder for anonymization.
-- This row provides only the required fields.
-- =============================================

UPDATE users
SET
	email = 'deleted@user',
	first_name = 'Deleted',
	last_name = 'User',
	selected_language = 'en'
WHERE user_id = '00000000-0000-0000-0000-000000000100';

INSERT INTO users (
	user_id,
	email,
	first_name,
	last_name,
	selected_language
)
SELECT
	'00000000-0000-0000-0000-000000000100',
	'deleted@user',
	'Deleted',
	'User',
	'en'
WHERE NOT EXISTS (
	SELECT 1 FROM users WHERE user_id = '00000000-0000-0000-0000-000000000100'
);
