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
VALUES ('820ea750-2c97-4e6b-9e2a-000000000001', 'a1c1d1f1-1111-1111-1111-000000000003', '00000000-0000-0000-0000-000000000101', 'Excellent academic fit', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000002', 'a1c1d1f1-1111-1111-1111-000000000005', '00000000-0000-0000-0000-000000000101', 'Lacks experience in cryptography', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000003', 'a1c1d1f1-1111-1111-1111-000000000011', '00000000-0000-0000-0000-000000000101', 'Strong alignment with research focus', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000004', 'a1c1d1f1-1111-1111-1111-000000000014', '00000000-0000-0000-0000-000000000101', 'Project not aligned with applicant’s background', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000005', 'a1c1d1f1-1111-1111-1111-000000000017', '00000000-0000-0000-0000-000000000101', 'Good CFD experience', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000006', 'a1c1d1f1-1111-1111-1111-000000000020', '00000000-0000-0000-0000-000000000101', 'Insufficient legal analysis background', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000007', 'd7bb4218-e813-41d2-8e91-29541a670682', '00000000-0000-0000-0000-000000000101', 'Outstanding design thinking skills', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000008', '6d483da2-3043-4940-a47b-81d4f0cf469f', '00000000-0000-0000-0000-000000000101', 'Withdrew voluntarily before review', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000009', 'fc5d23e1-dd90-4101-b3e8-a3dabc85bd12', '00000000-0000-0000-0000-000000000101', 'Great fit for precision agriculture', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000010', '3b5d2218-a666-42e0-917e-8f1b74834539', '00000000-0000-0000-0000-000000000101', 'Strong geoscience background', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000011', 'd394880d-6f76-443f-a55c-d6122440641a', '00000000-0000-0000-0000-000000000101', 'Excellent interview and proposal', '2025-07-01 10:00:00'),
       ('820ea750-2c97-4e6b-9e2a-000000000012', '592b5f21-24de-4519-bb49-3d53e65e8b62', '00000000-0000-0000-0000-000000000101', 'Strong logic and verification skills', '2025-07-01 10:00:00');
