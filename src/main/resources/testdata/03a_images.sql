-- =============================================
-- 03a_images.sql
-- Inserts example images (default banners and user-uploaded)
-- Preconditions:
--   - Users must already exist (uploaded_by references users.user_id)
--   - Must be imported BEFORE 04_jobs.sql (jobs reference images via image_id)
-- Note:
--   - Actual image files do not need to exist for database testing
--   - Create files in storage/images/ directory when testing frontend display
-- =============================================

-- Clean up existing images
DELETE FROM images
WHERE
    image_id LIKE '00000000-0000-0000-0000-000001%';

-- Insert example images
REPLACE INTO
    images (
        image_id,
        url,
        mime_type,
        size_bytes,
        image_type,
        is_default,
        school,
        uploaded_by,
        created_at,
        last_modified_at
    )
VALUES
    -- Default job banners for each school
    (
        '00000000-0000-0000-0000-000001000001',
        '/content/images/default-job-banners/default-cit-banner1.jpeg',
        'image/jpeg',
        245678,
        'DEFAULT_JOB_BANNER',
        TRUE,
        'CIT',
        NULL,
        '2025-01-01 10:00:00',
        '2025-01-01 10:00:00'
    ),
    (
        '00000000-0000-0000-0000-000001000002',
        '/content/images/default-job-banners/default-cit-banner2.jpeg',
        'image/jpeg',
        234567,
        'DEFAULT_JOB_BANNER',
        TRUE,
        'CIT',
        NULL,
        '2025-01-01 10:00:00',
        '2025-01-01 10:00:00'
    ),
    (
        '00000000-0000-0000-0000-000001000003',
        '/content/images/default-job-banners/default-cit-banner3.jpeg',
        'image/jpeg',
        256789,
        'DEFAULT_JOB_BANNER',
        TRUE,
        'CIT',
        NULL,
        '2025-01-01 10:00:00',
        '2025-01-01 10:00:00'
    ),
    (
        '00000000-0000-0000-0000-000001000004',
        '/content/images/default-job-banners/default-cit-banner4.jpeg',
        'image/jpeg',
        267890,
        'DEFAULT_JOB_BANNER',
        TRUE,
        'CIT',
        NULL,
        '2025-01-01 10:00:00',
        '2025-01-01 10:00:00'
    ),

-- User-uploaded job banners (uploaded by professors)
(
    '00000000-0000-0000-0000-000001000101',
    '/images/jobs/gamification-research-banner.jpg',
    'image/jpeg',
    456789,
    'JOB_BANNER',
    FALSE,
    NULL,
    '00000000-0000-0000-0000-000000000102', -- Professor Alice (Research Group 1)
    '2025-01-15 09:00:00',
    '2025-01-15 09:00:00'
),
(
    '00000000-0000-0000-0000-000001000102',
    '/images/jobs/ai-ethics-banner.jpg',
    'image/jpeg',
    389012,
    'JOB_BANNER',
    FALSE,
    NULL,
    '00000000-0000-0000-0000-000000000105', -- Professor2 TUM (Research Group 2)
    '2025-01-16 10:30:00',
    '2025-01-16 10:30:00'
),
(
    '00000000-0000-0000-0000-000001000103',
    '/images/jobs/quantum-computing-banner.jpg',
    'image/jpeg',
    512345,
    'JOB_BANNER',
    FALSE,
    NULL,
    '11111111-0000-0000-0000-000000000002', -- Professor Daniel Kim (Research Group 3)
    '2025-01-17 14:15:00',
    '2025-01-17 14:15:00'
);