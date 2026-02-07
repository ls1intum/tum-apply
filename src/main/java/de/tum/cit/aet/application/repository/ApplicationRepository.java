package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Spring Data JPA repository for the {@link Application} entity.
 */
@Repository
public interface ApplicationRepository extends TumApplyJpaRepository<Application, UUID>, ApplicationEntityRepository {
    @Query(
        """
            SELECT new de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO(
                a.applicationId,
                new de.tum.cit.aet.usermanagement.dto.ApplicantDTO(
                    new de.tum.cit.aet.usermanagement.dto.UserDTO(
                        ap.user.userId,
                        a.applicantEmail,
                        ap.user.avatar,
                        a.applicantFirstName,
                        a.applicantLastName,
                        a.applicantGender,
                        a.applicantNationality,
                        a.applicantBirthday,
                        a.applicantPhoneNumber,
                        a.applicantWebsite,
                        a.applicantLinkedinUrl,
                        ap.user.selectedLanguage,
                        NULL
                    ),
                    a.applicantStreet,
                    a.applicantPostalCode,
                    a.applicantCity,
                    a.applicantCountry,
                    a.applicantBachelorDegreeName,
                    a.applicantBachelorGradeUpperLimit,
                    a.applicantBachelorGradeLowerLimit,
                    a.applicantBachelorGrade,
                    a.applicantBachelorUniversity,
                    a.applicantMasterDegreeName,
                    a.applicantMasterGradeUpperLimit,
                    a.applicantMasterGradeLowerLimit,
                    a.applicantMasterGrade,
                    a.applicantMasterUniversity
                ),
                new de.tum.cit.aet.job.dto.JobCardDTO(
                    j.jobId,
                    j.title,
                    j.location,
                    CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                    COALESCE(d.name, 'No Department'),
                    a.applicationId,
                    a.state,
                    j.workload,
                    j.startDate,
                    j.endDate,
                    j.contractDuration,
                    i.url
                ),
                a.state,
                a.desiredStartDate,
                a.projects,
                a.specialSkills,
                a.motivation,
                NULL
            )
            FROM Application a
            LEFT JOIN a.applicant ap
            LEFT JOIN a.job j
            LEFT JOIN j.researchGroup rg
            LEFT JOIN rg.department d
            LEFT JOIN j.image i
        WHERE a.applicationId = :id
        """
    )
    ApplicationForApplicantDTO findDtoById(@Param("id") UUID id);

    @Query(
        """
            SELECT new de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO(
                a.applicationId,
                new de.tum.cit.aet.usermanagement.dto.ApplicantDTO(
                    new de.tum.cit.aet.usermanagement.dto.UserDTO(
                        ap.user.userId,
                        a.applicantEmail,
                        ap.user.avatar,
                        a.applicantFirstName,
                        a.applicantLastName,
                        a.applicantGender,
                        a.applicantNationality,
                        a.applicantBirthday,
                        a.applicantPhoneNumber,
                        a.applicantWebsite,
                        a.applicantLinkedinUrl,
                        ap.user.selectedLanguage,
                        NULL
                    ),
                    a.applicantStreet,
                    a.applicantPostalCode,
                    a.applicantCity,
                    a.applicantCountry,
                    a.applicantBachelorDegreeName,
                    a.applicantBachelorGradeUpperLimit,
                    a.applicantBachelorGradeLowerLimit,
                    a.applicantBachelorGrade,
                    a.applicantBachelorUniversity,
                    a.applicantMasterDegreeName,
                    a.applicantMasterGradeUpperLimit,
                    a.applicantMasterGradeLowerLimit,
                    a.applicantMasterGrade,
                    a.applicantMasterUniversity
                ),
                new de.tum.cit.aet.job.dto.JobCardDTO(
                    j.jobId,
                    j.title,
                    j.location,
                    CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                    COALESCE(d.name, 'No Department'),
                    a.applicationId,
                    a.state,
                    j.workload,
                    j.startDate,
                    j.endDate,
                    j.contractDuration,
                    i.url
                ),
                a.state,
                a.desiredStartDate,
                a.projects,
                a.specialSkills,
                a.motivation,
                NULL
            )
            FROM Application a
            LEFT JOIN a.job j
            LEFT JOIN a.applicant ap
            LEFT JOIN j.researchGroup rg
            LEFT JOIN rg.department d
            LEFT JOIN j.image i
            WHERE ap.user.userId = :userId AND j.jobId = :jobId
        """
    )
    ApplicationForApplicantDTO getApplicationDtoByApplicantUserIdAndJobJobId(@Param("userId") UUID userId, @Param("jobId") UUID jobId);

    @Modifying
    @Query("UPDATE Application a SET a.state = 'WITHDRAWN' WHERE a.applicationId = :applicationId")
    void withdrawApplicationById(UUID applicationId);

    /**
     * Finds all applicants for a specific job that are in the 'SENT' or 'IN_REVIEW'
     * state.
     * This is used to notify applicants about the job status update.
     *
     * @param jobId the ID of the job for which to find applicants
     * @return a set of {@link Application} containing all important applicant
     *         details
     */
    @Query(
        """
            SELECT a
            FROM Application a
            JOIN a.applicant ap
            WHERE a.job.jobId = :jobId
            AND a.state IN ('SENT', 'IN_REVIEW', 'INTERVIEW')
        """
    )
    Set<Application> findApplicantsToNotify(@Param("jobId") UUID jobId);

    @Transactional
    @Modifying
    @Query(
        """
            UPDATE Application a
            SET a.state =
                CASE
                    WHEN a.state = 'SAVED' THEN 'JOB_CLOSED'
                    WHEN a.state IN ('SENT', 'IN_REVIEW', 'INTERVIEW') AND :targetState = 'CLOSED' THEN 'JOB_CLOSED'
                    WHEN a.state IN ('SENT', 'IN_REVIEW', 'INTERVIEW') AND :targetState = 'APPLICANT_FOUND' THEN 'REJECTED'
                    ELSE a.state
                END
            WHERE a.job.jobId = :jobId
        """
    )
    void updateApplicationsForJob(@Param("jobId") UUID jobId, @Param("targetState") String targetState);

    @Query("SELECT a FROM Application a WHERE a.applicant.user.userId = :userId AND a.job.jobId = :jobId")
    Application getByApplicantByUserIdAndJobId(@Param("userId") UUID userId, @Param("jobId") UUID jobId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.applicant.user.userId = :applicantId")
    long countByApplicantId(@Param("applicantId") UUID applicantId);

    /**
     * Finds all applications submitted by a specific applicant.
     *
     * @param applicantId the ID of the applicant (user ID)
     * @return a list of applications
     */
    @Query("SELECT a FROM Application a WHERE a.applicant.user.userId = :applicantId")
    List<Application> findAllByApplicantId(@Param("applicantId") UUID applicantId);

    /**
     * Counts applications grouped by job and state for jobs with interview
     * processes
     * belonging to a specific professor.
     * This is optimized to fetch all counts in a single query instead of N×M
     * queries.
     * Used by the interview overview to efficiently get statistics across all jobs.
     *
     * @param professorId the ID of the professor whose jobs to count applications
     *                    for
     * @return List of Object arrays containing [Job, ApplicationState, Count]
     */
    @Query(
        """
            SELECT a.job, a.state, COUNT(a)
            FROM Application a
            WHERE a.job IN (
                SELECT ip.job FROM InterviewProcess ip
                WHERE ip.job.supervisingProfessor.userId = :professorId
            )
            GROUP BY a.job, a.state
        """
    )
    List<Object[]> countApplicationsByJobAndStateForInterviewProcesses(@Param("professorId") UUID professorId);

    /**
     * Finds an application by ID with applicant and user details fetched.
     *
     * @param id the ID of the application
     * @return the application with details, or empty if not found
     */
    @Query(
        """
        SELECT a FROM Application a
        LEFT JOIN FETCH a.applicant ap
        LEFT JOIN FETCH ap.user
        LEFT JOIN FETCH a.applicationReview
        WHERE a.applicationId = :id
        """
    )
    Optional<Application> findWithDetailsById(@Param("id") UUID id);

    @Query(
        """
            SELECT a.applicationId FROM Application a
            WHERE a.lastModifiedAt < :cutoff
            AND a.state IN ('WITHDRAWN', 'REJECTED', 'JOB_CLOSED', 'ACCEPTED')
        """
    )
    Slice<UUID> findApplicationsToBeDeletedBeforeCutoff(LocalDateTime cutoff, Pageable pageable);

    @Query(
        """
            SELECT DISTINCT a.applicant.user.userId FROM Application a
            WHERE function('date', a.lastModifiedAt) = function('date', :warningCutoff)
              AND a.state IN ('WITHDRAWN', 'REJECTED', 'JOB_CLOSED', 'ACCEPTED')
        """
    )
    List<UUID> findApplicantsToBeWarnedBeforeDeletion(LocalDateTime warningCutoff);
}
