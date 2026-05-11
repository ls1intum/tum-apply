package de.tum.cit.aet.reference.repository;

import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferenceRequestRepository extends JpaRepository<ReferenceRequest, UUID> {
    /**
     * @param applicationId the owning application
     * @return all reference requests linked to the application, in insertion order
     */
    List<ReferenceRequest> findByApplicationApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    /**
     * Loads a reference request by id with its owning application eagerly fetched. Used by callers
     * that need to inspect {@code application.applicationId} (for scope checks) without keeping an
     * open service-level transaction.
     *
     * @param id the reference request id
     * @return the reference request with its application loaded, or empty if none
     */
    @Query(
        """
        SELECT r FROM ReferenceRequest r
        JOIN FETCH r.application
        WHERE r.referenceRequestId = :id
        """
    )
    Optional<ReferenceRequest> findByIdWithApplication(@Param("id") UUID id);

    /**
     * Looks up a request by the SHA-256 hash of the raw token sent in the invitation email.
     * Eagerly loads the application, applicant user, job and research group so the caller can
     * read all the prefilled fields without a service-level transaction.
     *
     * @param tokenHash hash of the raw token presented by the referee
     * @return the matching request with application context, or empty if none
     */
    @Query(
        """
        SELECT r FROM ReferenceRequest r
        JOIN FETCH r.application a
        JOIN FETCH a.applicant ap
        JOIN FETCH ap.user
        JOIN FETCH a.job j
        JOIN FETCH j.researchGroup
        WHERE r.tokenHash = :tokenHash
        """
    )
    Optional<ReferenceRequest> findByTokenHashWithApplication(@Param("tokenHash") String tokenHash);

    /**
     * Counts how many reference requests on the given application have already been submitted.
     *
     * @param applicationId the owning application
     * @param status        the request status to count
     * @return the number of requests matching the status
     */
    long countByApplicationApplicationIdAndStatus(UUID applicationId, ReferenceRequestStatus status);
}
