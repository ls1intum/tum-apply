package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.Application;
import java.util.Set;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Application} entity.
 */
@Repository
public interface ApplicationRepository extends TumApplyJpaRepository<Application, UUID> {
    Set<Application> findAllByApplicantUserId(UUID applicantId);

    Set<Application> findAllByJobJobId(UUID jobId);
}
