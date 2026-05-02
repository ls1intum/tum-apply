package de.tum.cit.aet.core.documents.repository;

import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.ApplicantDocument;
import de.tum.cit.aet.core.documents.domain.ApplicationDocument;
import de.tum.cit.aet.core.documents.domain.Document;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for the unified Document model.
 *
 * The hierarchy uses Single Table Inheritance:
 * - {@link Document} (abstract base, mapped to the {@code documents} table)
 * - {@link ApplicantDocument} (discriminator {@code APPLICANT})
 * - {@link ApplicationDocument} (discriminator {@code APPLICATION})
 */
@Repository
public interface DocumentRepository extends TumApplyJpaRepository<Document, UUID> {
    /**
     * Returns every applicant-profile document owned by the given applicant, of any type.
     *
     * @param applicantUserId the owning applicant's user id
     * @return the matching set of applicant documents
     */
    @Query("SELECT d FROM ApplicantDocument d WHERE d.applicant.userId = :applicantUserId")
    Set<ApplicantDocument> findAllApplicantDocuments(@Param("applicantUserId") UUID applicantUserId);

    /**
     * Returns the applicant-profile documents of a specific type for the given applicant.
     *
     * @param applicantUserId the owning applicant's user id
     * @param documentType    the document type to filter by
     * @return the matching set of applicant documents
     */
    @Query("SELECT d FROM ApplicantDocument d WHERE d.applicant.userId = :applicantUserId AND d.documentType = :documentType")
    Set<ApplicantDocument> findApplicantDocumentsByType(
        @Param("applicantUserId") UUID applicantUserId,
        @Param("documentType") DocumentType documentType
    );

    /**
     * Returns every document attached to the given application, of any type.
     *
     * @param applicationId the application id
     * @return the matching set of application documents
     */
    @Query("SELECT d FROM ApplicationDocument d WHERE d.application.applicationId = :applicationId")
    Set<ApplicationDocument> findAllApplicationDocuments(@Param("applicationId") UUID applicationId);

    /**
     * Returns the application-scoped documents of a specific type for the given application.
     *
     * @param applicationId the application id
     * @param documentType  the document type to filter by
     * @return the matching set of application documents
     */
    @Query("SELECT d FROM ApplicationDocument d WHERE d.application.applicationId = :applicationId AND d.documentType = :documentType")
    Set<ApplicationDocument> findApplicationDocumentsByType(
        @Param("applicationId") UUID applicationId,
        @Param("documentType") DocumentType documentType
    );

    /**
     * Counts how many other Document rows reference the same on-disk file as the document
     * identified by {@code excludeId}. Used by the orphan-file cleanup logic to decide
     * whether the underlying file may be deleted from disk.
     *
     * @param path      the on-disk path to count references for
     * @param excludeId the id of the document being deleted (excluded from the count)
     * @return the number of remaining references to {@code path}
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.path = :path AND d.documentId <> :excludeId")
    long countOtherReferencesByPath(@Param("path") String path, @Param("excludeId") UUID excludeId);

    /**
     * Returns every document uploaded by the given user, regardless of subtype. Used by the
     * user-data export to bundle all uploads belonging to that user.
     *
     * @param userId the uploader's user id
     * @return the list of documents uploaded by the user
     */
    @Query("SELECT d FROM Document d WHERE d.uploadedBy.userId = :userId")
    List<Document> findByUploadedByUserId(@Param("userId") UUID userId);
}
