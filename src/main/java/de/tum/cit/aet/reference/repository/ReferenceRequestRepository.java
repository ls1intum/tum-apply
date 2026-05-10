package de.tum.cit.aet.reference.repository;

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
}
