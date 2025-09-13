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
TRUNCATE TABLE custom_field_answers;
TRUNCATE TABLE custom_fields;
TRUNCATE TABLE document_dictionary;
TRUNCATE TABLE documents;
TRUNCATE TABLE email_settings;
TRUNCATE TABLE email_template_translations;
TRUNCATE TABLE email_templates;
TRUNCATE TABLE email_verification_otp;
TRUNCATE TABLE internal_comments;
TRUNCATE TABLE jobs;
TRUNCATE TABLE ratings;
TRUNCATE TABLE research_groups;
TRUNCATE TABLE user_research_group_roles;
TRUNCATE TABLE user_settings;
TRUNCATE TABLE users;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
