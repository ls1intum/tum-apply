package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;

@Repository
public interface UserResearchGroupRoleRepository extends TumApplyJpaRepository<UserResearchGroupRole, UUID> {
    boolean existsByUserUserId(UUID userId);

    Set<UserResearchGroupRole> findAllByUser(User user);

    @EntityGraph(attributePaths = {"user", "user.researchGroupRoles", "user.researchGroup"})
    Set<UserResearchGroupRole> findAllByResearchGroupResearchGroupId(UUID researchGroupId);
}
