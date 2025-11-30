package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.School;
import jakarta.validation.constraints.NotNull;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link School} entity.
 */
@Repository
public interface SchoolRepository extends TumApplyJpaRepository<School, UUID> {
    @NotNull
    default School findByIdElseThrow(UUID schoolId) {
        return getArbitraryValueElseThrow(findById(schoolId));
    }

    Optional<School> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
