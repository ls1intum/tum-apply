-- =============================================
-- 08a_documents.sql
-- Inserts example documents and links them to applications
-- Preconditions:
--   - applications must exist
--   - users must exist
-- =============================================

-- Clean existing test documents
DELETE FROM TUMApply.document_dictionary WHERE document_dictionary_id LIKE '00000000-0000-0000-0000-40000000%';
DELETE FROM TUMApply.documents WHERE document_id LIKE '00000000-0000-0000-0000-40000000%';

-- Insert test documents
INSERT INTO TUMApply.documents (document_id, sha256_id, path, mime_type, size_bytes, uploaded_by, created_at, last_modified_at)
VALUES 
    -- Single test document used for all test cases
    ('00000000-0000-0000-0000-400000000001', 
     'sha256_test_document_001', 
     'storage/docs/testdata/test-document.pdf', 
     'application/pdf', 
     1048576, 
     '00000000-0000-0000-0000-000000000103',
     NOW(), 
     NOW());

-- Link documents to applications via document_dictionary.
-- IMPORTANT:
--   - application snapshot document: applicant_id = NULL, application_id = <application>
--   - applicant profile document:   applicant_id = <applicant>, application_id = NULL
INSERT INTO TUMApply.document_dictionary (document_dictionary_id, document_id, applicant_id, application_id, document_type, name)
VALUES 
    -- Documents for SAVED application (Max Applicant - Time Series Forecasting Intern)
    ('00000000-0000-0000-0000-400000010001', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020313',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010002', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020313',
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf'),
     
    -- Documents for ACCEPTED application (Max Applicant)
    ('00000000-0000-0000-0000-400000010003', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020003',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010004', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020003',
     'MASTER_TRANSCRIPT',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010005', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020003',
     'REFERENCE',
     'test-document.pdf'),
     
    -- Documents for SENT application (Max Applicant)
    ('00000000-0000-0000-0000-400000010006', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020111',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010007', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020111',
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010008', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020111',
     'MASTER_TRANSCRIPT',
     'test-document.pdf'),
     
    -- Documents for INTERVIEW application (Max Applicant)
    ('00000000-0000-0000-0000-400000010009', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020002',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010010', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020002',
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010011', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020002',
     'MASTER_TRANSCRIPT',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010012', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020002',
     'REFERENCE',
     'test-document.pdf'),
     
    -- Documents for REJECTED application (Max Applicant)
    ('00000000-0000-0000-0000-400000010013', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020837',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010014', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020837',
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf'),
     
    -- Documents for JOB_CLOSED application (Max Applicant)
    ('00000000-0000-0000-0000-400000010020', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020123',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010021', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020123',
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf'),
     
    -- Documents for SENT application (Sophie Lee)
    ('00000000-0000-0000-0000-400000010015', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020010',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010016', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020010',
     'MASTER_TRANSCRIPT',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010017', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020010',
     'REFERENCE',
     'test-document.pdf'),
     
    -- Documents for IN_REVIEW application (Noor Ahmed)
    ('00000000-0000-0000-0000-400000010018', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020007',
     'CV',
     'test-document.pdf'),
     
    ('00000000-0000-0000-0000-400000010019', 
     '00000000-0000-0000-0000-400000000001',
     NULL,
     '00000000-0000-0000-0000-300000020007',
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf'),

    -- Applicant profile documents (used to prefill newly created applications)
    ('00000000-0000-0000-0000-400000020001',
     '00000000-0000-0000-0000-400000000001',
     '00000000-0000-0000-0000-000000000103',
     NULL,
     'CV',
     'test-document.pdf'),

    ('00000000-0000-0000-0000-400000020002',
     '00000000-0000-0000-0000-400000000001',
     '11111111-0000-0000-0000-000000000011',
     NULL,
     'REFERENCE',
     'test-document.pdf'),

    ('00000000-0000-0000-0000-400000020003',
     '00000000-0000-0000-0000-400000000001',
     '11111111-0000-0000-0000-000000000007',
     NULL,
     'BACHELOR_TRANSCRIPT',
     'test-document.pdf');
