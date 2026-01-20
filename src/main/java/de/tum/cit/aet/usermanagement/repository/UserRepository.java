package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @EntityGraph(attributePaths = { "researchGroupRoles", "researchGroupRoles.role", "researchGroupRoles.researchGroup", "researchGroup" })
    Optional<User> findWithResearchGroupRolesByUserId(UUID userId);

    /**
     * Finds users by their IDs with eagerly loaded research group roles.
     *
     * @param userIds the list of user IDs
     * @return list of users with eagerly loaded collections
     */
    @Query(
        """
            SELECT u FROM User u
            LEFT JOIN FETCH u.researchGroupRoles
            WHERE u.userId IN :userIds
            ORDER BY u.firstName, u.lastName
        """
    )
    List<User> findUsersWithRolesByIds(@Param("userIds") List<UUID> userIds);

    /**
     * Finds user IDs by research group ID with pagination support.
     *
     * @param researchGroupId the research group ID
     * @param pageable        the pagination information
     * @return page of user IDs in the research group
     */
    @Query(
        """
            SELECT DISTINCT u.userId FROM User u
            JOIN u.researchGroupRoles rgr
            WHERE rgr.researchGroup.researchGroupId = :researchGroupId
        """
    )
    Page<UUID> findUserIdsByResearchGroupId(@Param("researchGroupId") UUID researchGroupId, Pageable pageable);

    /**
     * Finds users by their IDs with eagerly loaded research group roles and research group.
     * If a currentUserId is provided (non-null), the result will order that user first
     * and then the rest alphabetically by first and last name. If currentUserId is null,
     * the list will be ordered alphabetically.
     *
     * @param userIds       the list of user IDs
     * @param currentUserId (nullable) the current user's ID to display first. Pass null to fallback to pure alphabetical order.
     * @return list of users with eagerly loaded collections
     */
    @Query(
        """
            SELECT u FROM User u
            LEFT JOIN FETCH u.researchGroupRoles
            LEFT JOIN FETCH u.researchGroup
            WHERE u.userId IN :userIds
            ORDER BY
            CASE WHEN :currentUserId IS NOT NULL AND u.userId = :currentUserId THEN 0 ELSE 1 END,
            u.firstName, u.lastName
        """
    )
    List<User> findUsersWithRolesByIdsForResearchGroup(@Param("userIds") List<UUID> userIds, @Param("currentUserId") UUID currentUserId);

    /**
     * Finds a user by their university ID in a case-insensitive manner.
     *
     * @param universityId normalized university ID (e.g., "ab12cde")
     * @return optional user with matching university ID
     */
    Optional<User> findByUniversityIdIgnoreCase(String universityId);

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

    /**
     * Checks if a user exists with the given user ID.
     *
     * @param userId the user ID
     * @return true if a user exists with the ID, false otherwise
     */
    boolean existsById(UUID userId);

    /**
     * Deletes a user by ID using a bulk operation to avoid merging detached entities.
     *
     * @param userId the user ID to delete
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM User u WHERE u.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    /**
     * Finds user IDs for users available to be added to a research group.
     * Returns only IDs without JOIN FETCH for safe pagination.
     * Only includes TUM-affiliated users (email domain contains 'tum').
     *
     * @param searchQuery optional search query to filter by name or email
     * @param pageable pagination information
     * @return a Page of user IDs matching the criteria
     */
    @Query(
        """
            SELECT u.userId FROM User u
            LEFT JOIN u.researchGroupRoles rgr ON rgr.role = 'ADMIN'
            WHERE u.researchGroup IS NULL
            AND rgr.id IS NULL
            AND u.email LIKE '%@%tum%'
            AND (:searchQuery IS NULL OR
                 LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR
                 LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR
                 LOWER(u.email) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
            )
        """
    )
    Page<UUID> findAvailableUserIdsForResearchGroup(@Param("searchQuery") String searchQuery, Pageable pageable);

    /**
     * Finds user IDs that are inactive (based on last activity or creation date) and are NOT admins.
     *
     * @param cutoff the cutoff timestamp used to determine inactivity
     * @param pageable pagination information
     * @return a page of inactive non-admin user IDs
     */
    @Query(
        """
            SELECT u.userId
            FROM User u
            WHERE COALESCE(u.lastActivityAt, u.createdAt) < :cutoff
              AND NOT EXISTS (
                SELECT 1
                FROM UserResearchGroupRole urgr
                WHERE urgr.user = u
                  AND urgr.role = de.tum.cit.aet.usermanagement.constants.UserRole.ADMIN
              )
            ORDER BY COALESCE(u.lastActivityAt, u.createdAt) ASC
        """
    )
    Page<UUID> findInactiveNonAdminUserIdsForRetention(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);

    String email(String email);
}
