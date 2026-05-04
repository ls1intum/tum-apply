package de.tum.cit.aet.reference.repository;

import de.tum.cit.aet.reference.domain.ReferenceRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferenceRequestRepository extends JpaRepository<ReferenceRequest, UUID> {
    /**
     * @param applicationId the owning application
     * @return all reference requests linked to the application, in insertion order
     */
    List<ReferenceRequest> findByApplication_ApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
