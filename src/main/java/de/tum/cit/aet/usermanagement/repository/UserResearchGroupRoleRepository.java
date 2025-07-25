package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import org.springframework.stereotype.Repository;

import java.util.Set;
import java.util.UUID;

@Repository
public interface UserResearchGroupRoleRepository extends TumApplyJpaRepository<UserResearchGroupRole, UUID> {
    boolean existsByUserUserId(UUID userId);

    Set<UserResearchGroupRole> findAllByUser(User user);
}
