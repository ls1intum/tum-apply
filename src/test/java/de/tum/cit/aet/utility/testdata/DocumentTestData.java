package de.tum.cit.aet.utility.testdata;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.ApplicantDocument;
import de.tum.cit.aet.core.documents.domain.ApplicationDocument;
import de.tum.cit.aet.core.documents.domain.Document;
import de.tum.cit.aet.core.documents.repository.DocumentRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Test data helpers for the unified Document model. Each persisted row is either an
 * {@link ApplicantDocument} (profile-owned) or an {@link ApplicationDocument}
 * (application-scoped snapshot).
 */
public final class DocumentTestData {

    private DocumentTestData() {}

    /**
     * Copies a classpath resource into the given storage root and persists an {@link ApplicantDocument}.
     *
     * @param storageRootConfig  the storage root directory configured for the test (e.g. {@code aet.storage.root})
     * @param documentRepository the JPA repository for the unified Document model
     * @param uploadedBy         the user recorded as the uploader
     * @param applicant          the applicant who owns the document
     * @param type               the document type (e.g. CV, REFERENCE)
     * @param classpathResource  the path of the source PDF on the test classpath (e.g. {@code /testdocs/test-doc1.pdf})
     * @param filename           the on-disk filename inside the storage root
     * @return the persisted {@link ApplicantDocument}
     * @throws IOException if the resource cannot be read or copied
     */
    public static ApplicantDocument savedApplicantDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User uploadedBy,
        Applicant applicant,
        DocumentType type,
        String classpathResource,
        String filename
    ) throws IOException {
        Path pdfPath = copyClasspathResource(storageRootConfig, classpathResource, filename);

        ApplicantDocument doc = new ApplicantDocument();
        doc.setApplicant(applicant);
        doc.setDocumentType(type);
        doc.setName(filename);
        doc.setPath(pdfPath.toAbsolutePath().toString());
        doc.setMimeType("application/pdf");
        doc.setSizeBytes(Files.size(pdfPath));
        doc.setUploadedBy(uploadedBy);
        return documentRepository.saveAndFlush(doc);
    }

    /**
     * Copies a classpath resource into the given storage root and persists an {@link ApplicationDocument}.
     *
     * @param storageRootConfig  the storage root directory configured for the test
     * @param documentRepository the JPA repository for the unified Document model
     * @param uploadedBy         the user recorded as the uploader
     * @param application        the application the document belongs to
     * @param type               the document type (e.g. CV, REFERENCE)
     * @param classpathResource  the path of the source PDF on the test classpath
     * @param filename           the on-disk filename inside the storage root
     * @return the persisted {@link ApplicationDocument}
     * @throws IOException if the resource cannot be read or copied
     */
    public static ApplicationDocument savedApplicationDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User uploadedBy,
        Application application,
        DocumentType type,
        String classpathResource,
        String filename
    ) throws IOException {
        Path pdfPath = copyClasspathResource(storageRootConfig, classpathResource, filename);

        ApplicationDocument doc = new ApplicationDocument();
        doc.setApplication(application);
        doc.setDocumentType(type);
        doc.setName(filename);
        doc.setPath(pdfPath.toAbsolutePath().toString());
        doc.setMimeType("application/pdf");
        doc.setSizeBytes(Files.size(pdfPath));
        doc.setUploadedBy(uploadedBy);
        return documentRepository.saveAndFlush(doc);
    }

    /**
     * Copies a classpath resource into the storage root.
     *
     * @param storageRootConfig the storage root directory
     * @param classpathResource the resource path on the test classpath
     * @param filename          the target filename inside the storage root
     * @return the absolute path of the copied file
     * @throws IOException if the resource cannot be read or copied
     */
    private static Path copyClasspathResource(String storageRootConfig, String classpathResource, String filename) throws IOException {
        Path storageRoot = Path.of(storageRootConfig).toAbsolutePath().normalize();
        Files.createDirectories(storageRoot);

        Path pdfPath = storageRoot.resolve(filename);
        try (InputStream in = DocumentTestData.class.getResourceAsStream(classpathResource)) {
            assertThat(in).as("Classpath resource should exist: " + classpathResource).isNotNull();
            Files.copy(in, pdfPath, StandardCopyOption.REPLACE_EXISTING);
        }
        return pdfPath;
    }

    /**
     * Persists a Document tied to either an Application or an Applicant (XOR), with an already-prepared path.
     *
     * Returns the abstract {@link Document} base so callers may treat the result polymorphically.
     * The concrete subtype is {@link ApplicationDocument} when {@code application} is non-null, or
     * {@link ApplicantDocument} when {@code applicant} is non-null.
     *
     * @param documentRepository the JPA repository for the unified Document model
     * @param uploadedBy         the user recorded as the uploader
     * @param path               the on-disk path of the file (must lie within the storage root)
     * @param sizeBytes          the file size in bytes
     * @param mimeType           the MIME type (e.g. {@code application/pdf})
     * @param application        the owning application (XOR with applicant)
     * @param applicant          the owning applicant (XOR with application)
     * @param type               the document type (e.g. CV, REFERENCE)
     * @param name               the user-facing display name
     * @return the persisted {@link Document}
     * @throws IllegalArgumentException if both or neither of {@code application} and {@code applicant} are provided
     */
    public static Document savedDocument(
        DocumentRepository documentRepository,
        User uploadedBy,
        String path,
        long sizeBytes,
        String mimeType,
        Application application,
        Applicant applicant,
        DocumentType type,
        String name
    ) {
        if ((application == null) == (applicant == null)) {
            throw new IllegalArgumentException("Exactly one owner must be set: application XOR applicant.");
        }
        Document doc;
        if (application != null) {
            ApplicationDocument appDoc = new ApplicationDocument();
            appDoc.setApplication(application);
            doc = appDoc;
        } else {
            ApplicantDocument applicantDoc = new ApplicantDocument();
            applicantDoc.setApplicant(applicant);
            doc = applicantDoc;
        }
        doc.setDocumentType(type);
        doc.setName(name);
        doc.setPath(path);
        doc.setMimeType(mimeType);
        doc.setSizeBytes(sizeBytes);
        doc.setUploadedBy(uploadedBy);
        return documentRepository.saveAndFlush(doc);
    }

    /**
     * Convenience helper that copies the classpath resource and persists an {@link ApplicationDocument}
     * or {@link ApplicantDocument} (XOR) referring to that file. The persisted document's name is overridden
     * with the supplied logical {@code name}.
     *
     * @param storageRootConfig  the storage root directory configured for the test
     * @param documentRepository the JPA repository for the unified Document model
     * @param professor          the user recorded as the uploader
     * @param application        the owning application (XOR with applicant)
     * @param applicant          the owning applicant (XOR with application)
     * @param classpathResource  the path of the source PDF on the test classpath
     * @param filename           the on-disk filename inside the storage root
     * @param type               the document type (e.g. CV, REFERENCE)
     * @param name               the user-facing display name to set after the file is copied
     * @return the persisted {@link Document}; the concrete subtype matches the non-null owner
     * @throws IOException              if the resource cannot be read or copied
     * @throws IllegalArgumentException if both or neither of {@code application} and {@code applicant} are provided
     */
    public static Document savedDocumentWithFile(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User professor,
        Application application,
        Applicant applicant,
        String classpathResource,
        String filename,
        DocumentType type,
        String name
    ) throws IOException {
        if ((application == null) == (applicant == null)) {
            throw new IllegalArgumentException("Exactly one owner must be set: application XOR applicant.");
        }
        if (application != null) {
            ApplicationDocument doc = savedApplicationDocument(
                storageRootConfig,
                documentRepository,
                professor,
                application,
                type,
                classpathResource,
                filename
            );
            // Override the name with the explicit logical name passed in.
            doc.setName(name);
            return documentRepository.saveAndFlush(doc);
        } else {
            ApplicantDocument doc = savedApplicantDocument(
                storageRootConfig,
                documentRepository,
                professor,
                applicant,
                type,
                classpathResource,
                filename
            );
            doc.setName(name);
            return documentRepository.saveAndFlush(doc);
        }
    }

    /**
     * Creates and persists a Document without writing an actual file to disk. Useful for simple tests
     * that don't require real file content. The path is rooted at {@code /tmp/test-storage} so it
     * passes {@code DocumentService.removeFileIfOrphan} validation; {@code Files.deleteIfExists}
     * tolerates the missing file.
     *
     * @param documentRepository the JPA repository for the unified Document model
     * @param uploadedBy         the user recorded as the uploader
     * @param application        the owning application (XOR with applicant)
     * @param applicant          the owning applicant (XOR with application)
     * @param documentType       the document type (e.g. CV, REFERENCE)
     * @param fileName           the logical file name (used both for the display name and the mock path suffix)
     * @return the persisted {@link Document}; the concrete subtype is selected by the non-null owner
     */
    public static Document savedMockDocument(
        DocumentRepository documentRepository,
        User uploadedBy,
        Application application,
        Applicant applicant,
        DocumentType documentType,
        String fileName
    ) {
        Path mockPath = Path.of("/tmp/test-storage", "mock-" + fileName).toAbsolutePath().normalize();
        return savedDocument(
            documentRepository,
            uploadedBy,
            mockPath.toString(),
            1024L,
            "application/pdf",
            application,
            applicant,
            documentType,
            fileName
        );
    }

    /**
     * Creates a {@link MockMultipartFile} for testing document uploads.
     *
     * @param fieldName   the form field name (typically {@code "files"})
     * @param filename    the original filename
     * @param contentType the MIME type (e.g. {@code application/pdf})
     * @param content     the file content as raw bytes
     * @return a {@link MockMultipartFile} instance
     */
    public static MockMultipartFile createMockMultipartFile(String fieldName, String filename, String contentType, byte[] content) {
        return new MockMultipartFile(fieldName, filename, contentType, content);
    }

    /**
     * Creates a {@link MockMultipartFile} with default PDF content for testing.
     *
     * @param fieldName the form field name (typically {@code "files"})
     * @param filename  the original filename
     * @return a {@link MockMultipartFile} instance with PDF MIME type and default content
     */
    public static MockMultipartFile createMockPdfFile(String fieldName, String filename) {
        return createMockMultipartFile(fieldName, filename, "application/pdf", "PDF content here".getBytes());
    }

    /**
     * Creates a {@link MockMultipartFile} with the supplied content for testing.
     *
     * @param fieldName the form field name (typically {@code "files"})
     * @param filename  the original filename
     * @param content   the file content as a string (encoded with the platform default charset)
     * @return a {@link MockMultipartFile} instance with PDF MIME type
     */
    public static MockMultipartFile createMockPdfFile(String fieldName, String filename, String content) {
        return createMockMultipartFile(fieldName, filename, "application/pdf", content.getBytes());
    }
}
