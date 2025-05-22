package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Application} entity.
 */
@Repository
public interface ApplicationRepository extends TumApplyJpaRepository<Application, UUID> {
    @Query(
        """
            SELECT new your.package.ApplicationForApplicantDTO(
                a.applicationId,
                new your.package.ApplicantDTO(ap.applicantId, ap.name),
                new your.package.JobCardDTO(j.jobId, j.title),
                a.state,
                a.desiredStartDate,
                a.projects,
                a.specialSkills,
                a.motivation,
                NULL  -- Placeholder for customFields, cannot fetch complex sets directly in constructor expression
            )
            FROM Application a
            JOIN a.applicant ap
            JOIN a.job j
            WHERE a.applicationId = :id
        """
    )
    ApplicationForApplicantDTO findDtoById(@Param("id") UUID id);

    @Query(
        """
        SELECT new de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO(
            a.applicationId,
            new de.tum.cit.aet.usermanagement.dto.ApplicantDTO(
                ap.userId,
                ap.email,
                ap.firstName,
                ap.lastName,
                ap.gender,
                ap.nationality,
                ap.birthday,
                ap.phoneNumber,
                ap.website,
                ap.linkedinUrl,
                ap.selectedLanguage
            ),
            new de.tum.cit.aet.job.dto.JobCardDTO(
                j.jobId,
                j.title,
                j.fieldOfStudies,
                j.location,
                j.supervisingProfessor.userId,
                j.workload,
                j.startDate,
                j.createdAt
            ),
            a.state,
            a.desiredStartDate,
            a.projects,
            a.specialSkills,
            a.motivation
        )
        FROM Application a
        JOIN a.applicant ap
        JOIN a.job j
        WHERE ap.userId = :applicantId
        """
    )
    Set<ApplicationForApplicantDTO> findAllDtosByApplicantUserId(UUID applicantId);

    @Query(
        """
            SELECT new de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO(
                a.applicationId,
                new de.tum.cit.aet.usermanagement.dto.ApplicantDTO(
                    ap.userId,
                    ap.email,
                    ap.firstName,
                    ap.lastName,
                    ap.gender,
                    ap.nationality,
                    ap.birthday,
                    ap.phoneNumber,
                    ap.website,
                    ap.linkedinUrl,
                    ap.selectedLanguage
                ),
                new de.tum.cit.aet.job.dto.JobCardDTO(
                    j.jobId,
                    j.title,
                    j.fieldOfStudies,
                    j.location,
                    j.supervisingProfessor.userId,
                    j.workload,
                    j.startDate,
                    j.createdAt
                ),
                a.state,
                a.desiredStartDate,
                a.projects,
                a.specialSkills,
                a.motivation
            )
            FROM Application a
            JOIN a.applicant ap
            JOIN a.job j
            WHERE j.jobId = :jobId
        """
    )
    Set<ApplicationForApplicantDTO> findAllDtosByJobJobId(UUID jobId);

    boolean existsByApplicantUserIdAndJobJobId(UUID applicantId, UUID jobId);

    @Modifying
    @Query(
        value = """
            INSERT INTO application (
                applicant_id,
                job_id,
                state,
                desired_start_date,
                projects,
                special_skills,
                motivation
            ) VALUES (
                :applicantId,
                :jobId,
                :state,
                :desiredDate,
                :projects,
                :specialSkills,
                :motivation
            )
        """,
        nativeQuery = true
    )
    void insertApplication(
        @Param("applicantId") UUID applicantId,
        @Param("jobId") UUID jobId,
        @Param("state") String state,
        @Param("desiredDate") LocalDate desiredDate,
        @Param("projects") String projects,
        @Param("specialSkills") String specialSkills,
        @Param("motivation") String motivation
    );

    @Modifying
    @Query(
        value = """
            UPDATE application SET
                state = :state,
                desired_start_date = :desiredDate,
                projects = :projects,
                special_skills = :specialSkills,
                motivation = :motivation
            WHERE application_id = :applicationId
        """,
        nativeQuery = true
    )
    void updateApplication(
        @Param("applicationId") UUID applicationId,
        @Param("state") String state,
        @Param("desiredDate") LocalDate desiredDate,
        @Param("projects") String projects,
        @Param("specialSkills") String specialSkills,
        @Param("motivation") String motivation
    );

    @Query(
        """
            SELECT new your.package.ApplicationForApplicantDTO(
                a.applicationId,
                new your.package.ApplicantDTO(ap.applicantId, ap.name),
                new your.package.JobCardDTO(j.jobId, j.title),
                a.state,
                a.desiredStartDate,
                a.projects,
                a.specialSkills,
                a.motivation,
                NULL  -- customFields to be populated later
            )
            FROM Application a
            JOIN a.applicant ap
            JOIN ap.user u
            JOIN a.job j
            WHERE u.id = :userId AND j.jobId = :jobId
        """
    )
    ApplicationForApplicantDTO getApplicationDtoByApplicantUserIdAndJobJobId(@Param("userId") UUID userId, @Param("jobId") UUID jobId);

    @Query("update Application a set a.state = 'WITHDRAWN' WHERE a.id = :applicationId")
    void withdrawApplicationById(UUID applicationId);
}
