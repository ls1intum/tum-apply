-- =============================================
-- 13_deleted_user.sql
-- Inserts a dummy "deleted user" placeholder for anonymization.
-- This row provides only the required fields.
-- =============================================

INSERT INTO users (
	user_id,
	email,
	first_name,
	last_name,
	selected_language
)
VALUES (
	'00000000-0000-0000-0000-000000000100',
	'deleted@user',
	'Deleted',
	'User',
	'en'
)
ON DUPLICATE KEY UPDATE
	email = VALUES(email),
	first_name = VALUES(first_name),
	last_name = VALUES(last_name),
	selected_language = VALUES(selected_language);
