package de.tum.cit.aet.job.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobCardDTO;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link Job} entity.
 */
@Repository
public interface JobRepository extends TumApplyJpaRepository<Job, UUID> {
    /**
     * Finds all jobs with the given state and returns them as {@link JobCardDTO} projections.
     *
     * @param state the state of the jobs to filter by (e.g., OPEN, DRAFT).
     * @return a list of job DTOs matching the given state.
     */
    //List<JobCardDTO> findAllJobsByState(@Param("state") JobState state);

    /**
     * Retrieves all jobs posted by a specific professor as {@link JobCardDTO} projections.
     *
     * @param professorId the UUID of the professor (user) who created the job postings.
     * @return a list of job DTOs created by the given professor.
     */
    //List<JobCardDTO> findAllJobsByProfessor(@Param("professorId") UUID professorId);

    /**
     * Returns all jobs with the given state as {@link JobCardDTO} projections.
     *
     * @param state the {@link JobState} to filter jobs by (e.g. PUBLISHED)
     * @return a list of projected job cards
     */
    @Query(
        """
            SELECT new de.tum.cit.aet.job.dto.JobCardDTO(
                j.jobId,
                j.title,
                j.fieldOfStudies,
                j.location,
                CONCAT(j.supervisingProfessor.firstName, ' ', j.supervisingProfessor.lastName),
                j.workload,
                j.startDate,
                j.createdAt
            )
            FROM Job j
            WHERE j.state = :state
        """
    )
    List<JobCardDTO> findAllJobCardsByState(@Param("state") JobState state);
}
