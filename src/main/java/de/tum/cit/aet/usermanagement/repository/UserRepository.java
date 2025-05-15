package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.validation.constraints.NotNull;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface UserRepository extends TumApplyJpaRepository<User, UUID> {
    @NotNull
    default User findByIdElseThrow(UUID userId) {
        return getArbitraryValueElseThrow(findById(userId));
    }

    @EntityGraph(attributePaths = { "researchGroupRoles", "researchGroupRoles.role", "researchGroupRoles.researchGroup" })
    Optional<User> findWithResearchGroupRolesByEmailIgnoreCase(String email);
}
