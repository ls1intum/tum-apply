package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface UserRepository extends TumApplyJpaRepository<User, UUID> {
    @NotNull
    default User findByIdElseThrow(UUID userId) {
        return getArbitraryValueElseThrow(findById(userId));
    }

    @EntityGraph(attributePaths = {"researchGroupRoles", "researchGroupRoles.role", "researchGroupRoles.researchGroup", "researchGroup"})
    Optional<User> findWithResearchGroupRolesByUserId(UUID userId);

    /**
     * Finds users by their IDs with eagerly loaded research group roles.
     *
     * @param userIds the list of user IDs
     * @return list of users with eagerly loaded collections
     */
    @Query("""
            SELECT u FROM User u
            LEFT JOIN FETCH u.researchGroupRoles
            WHERE u.userId IN :userIds
            ORDER BY u.firstName, u.lastName
        """)
    List<User> findUsersWithRolesByIds(@Param("userIds") List<UUID> userIds);

    /**
     * Finds user IDs by research group ID with pagination support.
     *
     * @param researchGroupId the research group ID
     * @param pageable        the pagination information
     * @return page of user IDs in the research group
     */
    @Query("""
            SELECT DISTINCT u.userId FROM User u
            JOIN u.researchGroupRoles rgr
            WHERE rgr.researchGroup.researchGroupId = :researchGroupId
        """)
    Page<UUID> findUserIdsByResearchGroupId(@Param("researchGroupId") UUID researchGroupId, Pageable pageable);

    /**
     * Finds users by their IDs with eagerly loaded research group roles and research group.
     * Orders results with the current user first, then alphabetically.
     *
     * @param userIds       the list of user IDs
     * @param currentUserId the current user's ID to display first
     * @return list of users with eagerly loaded collections
     */
    @Query("""
            SELECT u FROM User u
            LEFT JOIN FETCH u.researchGroupRoles
            LEFT JOIN FETCH u.researchGroup
            WHERE u.userId IN :userIds
            ORDER BY
            CASE WHEN u.userId = :currentUserId THEN 0 ELSE 1 END,
            u.firstName, u.lastName
        """)
    List<User> findUsersWithRolesByIdsForResearchGroup(@Param("userIds") List<UUID> userIds, @Param("currentUserId") UUID currentUserId);

    /**
     * Finds a user by email in a case-insensitive manner.
     *
     * @param email normalized email address
     * @return optional user
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Checks if a user exists with the given email in a case-insensitive manner.
     *
     * @param email normalized email address
     * @return true if a user exists with the email, false otherwise
     */
    boolean existsByEmailIgnoreCase(String email);

    String email(String email);
}
