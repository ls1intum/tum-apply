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
 * Repository for the unified Document model (STI base + ApplicantDocument + ApplicationDocument).
 */
@Repository
public interface DocumentRepository extends TumApplyJpaRepository<Document, UUID> {
    @Query("SELECT d FROM ApplicantDocument d WHERE d.applicant.userId = :applicantUserId")
    Set<ApplicantDocument> findAllApplicantDocuments(@Param("applicantUserId") UUID applicantUserId);

    @Query("SELECT d FROM ApplicantDocument d WHERE d.applicant.userId = :applicantUserId AND d.documentType = :documentType")
    Set<ApplicantDocument> findApplicantDocumentsByType(
        @Param("applicantUserId") UUID applicantUserId,
        @Param("documentType") DocumentType documentType
    );

    @Query("SELECT d FROM ApplicationDocument d WHERE d.application.applicationId = :applicationId")
    Set<ApplicationDocument> findAllApplicationDocuments(@Param("applicationId") UUID applicationId);

    @Query("SELECT d FROM ApplicationDocument d WHERE d.application.applicationId = :applicationId AND d.documentType = :documentType")
    Set<ApplicationDocument> findApplicationDocumentsByType(
        @Param("applicationId") UUID applicationId,
        @Param("documentType") DocumentType documentType
    );

    @Query("SELECT COUNT(d) FROM Document d WHERE d.path = :path AND d.documentId <> :excludeId")
    long countOtherReferencesByPath(@Param("path") String path, @Param("excludeId") UUID excludeId);

    @Query("SELECT d FROM Document d WHERE d.uploadedBy.userId = :userId")
    List<Document> findByUploadedByUserId(@Param("userId") UUID userId);
}
