package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface UserResearchGroupRoleRepository extends TumApplyJpaRepository<UserResearchGroupRole, UUID> {
    boolean existsByUserUserId(UUID userId);
}
