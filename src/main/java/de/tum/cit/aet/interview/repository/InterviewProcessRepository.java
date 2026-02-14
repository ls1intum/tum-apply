package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewProcess;
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
     * Find all InterviewProcesses for jobs created by a specific professor.
     *
     * @param professorId the ID of the professor
     * @return list of InterviewProcesses for the professor's jobs
     */
    @Query(
        """
        SELECT ip
        FROM InterviewProcess ip
        JOIN FETCH ip.job job
        WHERE job.supervisingProfessor.userId = :professorId
        """
    )
    List<InterviewProcess> findAllByProfessorId(@Param("professorId") UUID professorId);

    /**
     * Find all InterviewProcesses for jobs belonging to a specific research group.
     *
     * @param researchGroupId the ID of the research group
     * @return list of InterviewProcesses for the research group's jobs
     */
    @Query(
        """
        SELECT ip
        FROM InterviewProcess ip
        JOIN FETCH ip.job job
        WHERE job.researchGroup.researchGroupId = :researchGroupId
        """
    )
    List<InterviewProcess> findAllByResearchGroupId(@Param("researchGroupId") UUID researchGroupId);

    /**
     * Finds an interview process by the associated job identifier.
     *
     * @param jobId the UUID of the job to search for; must not be {@code null}
     * @return an {@link Optional} containing the {@link InterviewProcess} if found,
     *         or an empty {@link Optional} if no process exists for the given job
     * @throws IllegalArgumentException if {@code jobId} is {@code null}
     */
    Optional<InterviewProcess> findByJobJobId(UUID jobId);
}
