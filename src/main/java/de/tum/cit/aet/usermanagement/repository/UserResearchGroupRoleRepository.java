package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserResearchGroupRoleRepository extends TumApplyJpaRepository<UserResearchGroupRole, UUID> {
    boolean existsByUserUserId(UUID userId);

    Set<UserResearchGroupRole> findAllByUser(User user);

    Optional<UserResearchGroupRole> findByUserAndResearchGroup(User user, ResearchGroup researchGroup);

    /**
     * Removes research group association from all roles for a specific user.
     *
     * @param userId the ID of the user whose research group associations should be removed
     */
    @Modifying
    @Query("UPDATE UserResearchGroupRole urgr SET urgr.researchGroup = null WHERE urgr.user.userId = :userId")
    void removeResearchGroupFromUserRoles(@Param("userId") UUID userId);

    /**
     * Deletes a specific role entry for a user from the UserResearchGroupRole table.
     * <p>
     * This method removes the association between a given user and a role
     * (e.g., APPLICANT or PROFESSOR) in the context of any research group.
     * It does not affect other roles or the research group membership itself.
     *
     * @param user the user whose role should be removed
     * @param role the specific role to remove for the user
     */
    @Modifying
    @Query("DELETE FROM UserResearchGroupRole urgr WHERE urgr.user = :user AND urgr.role = :role")
    void deleteByUserAndRole(@Param("user") User user, @Param("role") de.tum.cit.aet.usermanagement.constants.UserRole role);

}
