package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface ApplicantRepository extends TumApplyJpaRepository<Applicant, UUID> {
    @Modifying
    @Query(
        value = """
            INSERT INTO applicants (
                user_id, email, first_name, last_name, gender, nationality, birthday, phone_number,
                website, linkedin_url, selected_language, street, postal_code, city, country,
                bachelor_degree_name, bachelor_grading_scale, bachelor_grade, bachelor_university,
                master_degree_name, master_grading_scale, master_grade, master_university
            )
            VALUES (
                :userId, :email, :firstName, :lastName, :gender, :nationality, :birthday, :phoneNumber,
                :website, :linkedinUrl, :selectedLanguage, :street, :postalCode, :city, :country,
                :bachelorDegreeName, :bachelorGradingScale, :bachelorGrade, :bachelorUniversity,
                :masterDegreeName, :masterGradingScale, :masterGrade, :masterUniversity
            )
        """,
        nativeQuery = true
    )
    void insertApplicant(
        @Param("userId") UUID userId,
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
        @Param("street") String street,
        @Param("postalCode") String postalCode,
        @Param("city") String city,
        @Param("country") String country,
        @Param("bachelorDegreeName") String bachelorDegreeName,
        @Param("bachelorGradingScale") String bachelorGradingScale,
        @Param("bachelorGrade") String bachelorGrade,
        @Param("bachelorUniversity") String bachelorUniversity,
        @Param("masterDegreeName") String masterDegreeName,
        @Param("masterGradingScale") String masterGradingScale,
        @Param("masterGrade") String masterGrade,
        @Param("masterUniversity") String masterUniversity
    );

    @Modifying
    @Query(
        value = """
            UPDATE applicants SET
                street = :street,
                postal_code = :postalCode,
                city = :city,
                country = :country,
                bachelor_degree_name = :bachelorDegreeName,
                bachelor_grading_scale = :bachelorGradingScale,
                bachelor_grade = :bachelorGrade,
                bachelor_university = :bachelorUniversity,
                master_degree_name = :masterDegreeName,
                master_grading_scale = :masterGradingScale,
                master_grade = :masterGrade,
                master_university = :masterUniversity
            WHERE user_id = :userId
        """,
        nativeQuery = true
    )
    void updateApplicant(
        @Param("street") String street,
        @Param("postalCode") String postalCode,
        @Param("city") String city,
        @Param("country") String country,
        @Param("bachelorDegreeName") String bachelorDegreeName,
        @Param("bachelorGradingScale") String bachelorGradingScale,
        @Param("bachelorGrade") String bachelorGrade,
        @Param("bachelorUniversity") String bachelorUniversity,
        @Param("masterDegreeName") String masterDegreeName,
        @Param("masterGradingScale") String masterGradingScale,
        @Param("masterGrade") String masterGrade,
        @Param("masterUniversity") String masterUniversity,
        @Param("userId") UUID userId
    );
}
