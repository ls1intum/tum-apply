package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
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
    Optional<User> findWithResearchGroupRolesByEmailIgnoreCase(String email);

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
}
