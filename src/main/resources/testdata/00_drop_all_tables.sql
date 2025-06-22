-- =============================================
-- 00_drop_all_tables.sql
-- Resets the database by truncating all tables
-- Preconditions:
--   - All tables must already exist
--   - This script removes all data and resets auto-increment values
-- =============================================

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate all tables
TRUNCATE TABLE applicants;
TRUNCATE TABLE application_reviews;
TRUNCATE TABLE applications;
TRUNCATE TABLE custom_fields;
TRUNCATE TABLE jobs;
TRUNCATE TABLE research_groups;
TRUNCATE TABLE user_research_group_roles;
TRUNCATE TABLE users;
TRUNCATE TABLE custom_field_answers;
TRUNCATE TABLE documents;
TRUNCATE TABLE internal_comments;
TRUNCATE TABLE document_dictionary;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
