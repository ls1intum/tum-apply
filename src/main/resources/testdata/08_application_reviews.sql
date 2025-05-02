-- =============================================
-- 08_application_reviews.sql
-- Inserts example application_reviews
-- Preconditions:
--   - applications must exist
--   - users (reviewer) must exist
-- =============================================

-- clean existing data
DELETE
FROM application_reviews
WHERE application_review_id IN ('fd7d62ea-9353-44df-b91c-170a74823aad',
                                'ece2685c-f122-4879-a31f-ff879aaab9c0',
                                '71e44d2e-9bb5-4424-ac2d-58be111c0083');


-- insert test data
REPLACE INTO application_reviews (application_review_id, application_id, user_id, reason, reviewed_at)
VALUES ('fd7d62ea-9353-44df-b91c-170a74823aad', '2438c612-6045-408c-8528-af4e99a52859',
        '00000000-0000-0000-0000-000000000101', 'Strong academic background', '2025-04-20 00:00:00'),
       ('ece2685c-f122-4879-a31f-ff879aaab9c0', '2a18ee8b-9f8d-4369-89fd-7d4768845efa',
        '00000000-0000-0000-0000-000000000101', 'Lacks relevant experience', '2025-04-21 00:00:00'),
       ('71e44d2e-9bb5-4424-ac2d-58be111c0083', 'f7ec007f-fba0-4135-b88c-c70eec79faf3',
        '00000000-0000-0000-0000-000000000101', NULL, NULL);
