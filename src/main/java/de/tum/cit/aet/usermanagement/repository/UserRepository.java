package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
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

    boolean existsByEmailIgnoreCase(String email);

    @Modifying
    @Query(
        value = """
            UPDATE users SET
                email = :email,
                first_name = :firstName,
                last_name = :lastName,
                gender = :gender,
                nationality = :nationality,
                birthday = :birthday,
                phone_number = :phoneNumber,
                website = :website,
                linkedin_url = :linkedinUrl,
                selected_language = :selectedLanguage
            WHERE user_id = :userId
        """,
        nativeQuery = true
    )
    void updateUser(
        @Param("email") String email,
        @Param("firstName") String firstName,
        @Param("lastName") String lastName,
        @Param("gender") String gender,
        @Param("nationality") String nationality,
        @Param("birthday") LocalDate birthday,
        @Param("phoneNumber") String phoneNumber,
        @Param("website") String website,
        @Param("linkedinUrl") String linkedinUrl,
        @Param("selectedLanguage") String selectedLanguage,
        @Param("userId") UUID userId
    );

    @Modifying
    @Query(
        value = """
            INSERT INTO users (
                email,
                first_name, last_name, gender, nationality, birthday, phone_number,
                website, linkedin_url, selected_language
            ) VALUES (
                :email,
                :firstName,
                :lastName,
                :gender,
                :nationality,
                :birthday,
                :phoneNumber,
                :website,
                :linkedinUrl,
                :selectedLanguage
            )
        """,
        nativeQuery = true
    )
    void insertUser(
        @Param("email") String email,
        @Param("firstName") String firstName,
        @Param("lastName") String lastName,
        @Param("gender") String gender,
        @Param("nationality") String nationality,
        @Param("birthday") LocalDate birthday,
        @Param("phoneNumber") String phoneNumber,
        @Param("website") String website,
        @Param("linkedinUrl") String linkedinUrl,
        @Param("selectedLanguage") String selectedLanguage
    );

    /**
     * Searches for user IDs that are not members of any research group.
     * The search is case-insensitive and searches in first name, last name, and email.
     * Results are limited to 8 users.
     *
     * @param query the search query
     * @return list of user IDs not in any research group matching the search criteria (max 8 results)
     */
    @Query("""
        SELECT u.userId FROM User u 
        WHERE u.researchGroup IS NULL 
        AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) 
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY u.firstName, u.lastName
        LIMIT 8
    """)
    List<UUID> findAvailableUserIdsByQuery(@Param("query") String query);

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
     * Finds users by research group ID with pagination support.
     *
     * @param researchGroupId the research group ID
     * @param pageable the pagination information
     * @return page of users in the research group
     */
    @Query("""
        SELECT u FROM User u 
        JOIN u.researchGroupRoles rgr 
        WHERE rgr.researchGroup.researchGroupId = :researchGroupId
        ORDER BY u.firstName, u.lastName
    """)
    Page<User> findAllByResearchGroupResearchGroupId(@Param("researchGroupId") UUID researchGroupId, Pageable pageable);
}
