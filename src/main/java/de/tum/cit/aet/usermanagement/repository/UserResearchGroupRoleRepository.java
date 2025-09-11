package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserResearchGroupRoleRepository extends TumApplyJpaRepository<UserResearchGroupRole, UUID> {
    boolean existsByUserUserId(UUID userId);

    Set<UserResearchGroupRole> findAllByUser(User user);

    @EntityGraph(attributePaths = {"user", "user.researchGroupRoles", "user.researchGroup"})
    Set<UserResearchGroupRole> findAllByResearchGroupResearchGroupId(UUID researchGroupId);

    /**
     * Removes research group association from all roles for a specific user.
     * Sets the research group to null while preserving the role entries.
     *
     * @param userId the ID of the user whose research group associations should be removed
     */
    @Modifying
    @Query("UPDATE UserResearchGroupRole urgr SET urgr.researchGroup = null WHERE urgr.user.userId = :userId")
    void removeResearchGroupFromUserRoles(@Param("userId") UUID userId);
}
