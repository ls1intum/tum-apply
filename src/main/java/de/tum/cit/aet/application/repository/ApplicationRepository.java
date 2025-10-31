package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.interview.dto.InterviewStatisticsDTO;
import de.tum.cit.aet.job.domain.Job;
import java.util.List;
import java.util.Set;
import java.util.UUID;
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
                        ap.user.email,
                        ap.user.avatar,
                        ap.user.firstName,
                        ap.user.lastName,
                        ap.user.gender,
                        ap.user.nationality,
                        ap.user.birthday,
                        ap.user.phoneNumber,
                        ap.user.website,
                        ap.user.linkedinUrl,
                        ap.user.selectedLanguage,
                        NULL
                    ),
                    ap.street,
                    ap.postalCode,
                    ap.city,
                    ap.country,
                    ap.bachelorDegreeName,
                    ap.bachelorGradeUpperLimit,
                    ap.bachelorGradeLowerLimit,
                    ap.bachelorGrade,
                    ap.bachelorUniversity,
                    ap.masterDegreeName,
                    ap.masterGradeUpperLimit,
                    ap.masterGradeLowerLimit,
                    ap.masterGrade,
                    ap.masterUniversity
                ),
                new de.tum.cit.aet.job.dto.JobCardDTO(
                    j.jobId,
                    j.title,
                    j.fieldOfStudies,
                    j.location,
                    CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                    a.applicationId,
                    a.state,
                    j.workload,
                    j.startDate,
                    j.endDate
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
                        ap.user.email,
                        ap.user.avatar,
                        ap.user.firstName,
                        ap.user.lastName,
                        ap.user.gender,
                        ap.user.nationality,
                        ap.user.birthday,
                        ap.user.phoneNumber,
                        ap.user.website,
                        ap.user.linkedinUrl,
                        ap.user.selectedLanguage,
                        NULL
                    ),
                    ap.street,
                    ap.postalCode,
                    ap.city,
                    ap.country,
                    ap.bachelorDegreeName,
                    ap.bachelorGradeUpperLimit,
                    ap.bachelorGradeLowerLimit,
                    ap.bachelorGrade,
                    ap.bachelorUniversity,
                    ap.masterDegreeName,
                    ap.masterGradeUpperLimit,
                    ap.masterGradeLowerLimit,
                    ap.masterGrade,
                    ap.masterUniversity
                ),
                new de.tum.cit.aet.job.dto.JobCardDTO(
                    j.jobId,
                    j.title,
                    j.fieldOfStudies,
                    j.location,
                    CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                    a.applicationId,
                    a.state,
                    j.workload,
                    j.startDate,
                    j.endDate
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
            AND a.state IN ('SENT', 'IN_REVIEW')
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
                    WHEN a.state IN ('SENT', 'IN_REVIEW') AND :targetState = 'CLOSED' THEN 'JOB_CLOSED'
                    WHEN a.state IN ('SENT', 'IN_REVIEW') AND :targetState = 'APPLICANT_FOUND' THEN 'REJECTED'
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
     * Count applications for a specific job with a given state.
     *
     * @param job the job to filter by
     * @param state the application state to filter by
     * @return count of applications matching the criteria
     */
    long countByJobAndState(Job job, ApplicationState state);

    /**
     * Count applications for a specific job with any of the given states.
     *
     * @param job the job to filter by
     * @param states list of application states to filter by
     * @return count of applications matching the criteria
     */
    long countByJobAndStateIn(Job job, List<ApplicationState> states);

    /**
     * Retrieves aggregated interview statistics by joining from InterviewProcess.
     * This ensures only applications for jobs with an active interview process are included.
     *
     * @param professorId the UUID of the professor
     * @return list of statistics containing job ID, application state, and count
     */
    @Query("""
        SELECT new de.tum.cit.aet.interview.dto.InterviewStatisticsDTO(
            j.jobId,
            a.state,
            COUNT(a)
        )
        FROM InterviewProcess ip
        JOIN ip.job j
        JOIN j.applications a
        WHERE j.supervisingProfessor.userId = :professorId
        GROUP BY j.jobId, a.state
        """)
    List<InterviewStatisticsDTO> getInterviewStatistics(@Param("professorId") UUID professorId);
}
