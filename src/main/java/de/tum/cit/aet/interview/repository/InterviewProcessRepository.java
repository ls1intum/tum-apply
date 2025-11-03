package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.job.domain.Job;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InterviewProcessRepository extends JpaRepository<InterviewProcess, UUID> {
    /**
     * Find an InterviewProcess by the associated Job.
     *
     * @param job the job to search for
     * @return Optional containing the InterviewProcess if found
     */
    Optional<InterviewProcess> findByJob(Job job);

    /**
     * Check if an InterviewProcess exists for a given Job.
     *
     * @param job the job to check
     * @return true if an InterviewProcess exists for this job
     */
    boolean existsByJob(Job job);

    /**
     * Find all InterviewProcesses for jobs created by a specific professor.
     *
     * @param professorId the ID of the professor
     * @return list of InterviewProcesses for the professor's jobs
     */
    @Query(
        """
        SELECT ip
        FROM InterviewProcess ip
        WHERE ip.job.supervisingProfessor.userId = :professorId
        """
    )
    List<InterviewProcess> findAllByProfessorId(@Param("professorId") UUID professorId);

    /**
     * Checks whether at least one entity exists for the given job identifier.
     *
     * @param jobId the UUID of the job to check; must not be {@code null}
     * @return {@code true} if at least one record with the given {@code jobId} exists,
     *         {@code false} otherwise
     * @throws IllegalArgumentException if {@code jobId} is {@code null}
     *
     */
    boolean existsByJobId(UUID jobId);
}
