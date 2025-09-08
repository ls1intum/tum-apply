package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.validation.constraints.NotNull;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface ResearchGroupRepository extends TumApplyJpaRepository<ResearchGroup, UUID> {
    @NotNull
    default ResearchGroup findByIdElseThrow(UUID researchGroupId) {
        return getArbitraryValueElseThrow(findById(researchGroupId));
    }

    @NotNull
    default ResearchGroup findByUniversityIDElseThrow(String universityID) {
        return getArbitraryValueElseThrow(findByUniversityID(universityID));
    }
    Optional<ResearchGroup> findByUniversityID(String universityID);
}
