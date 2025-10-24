package de.tum.cit.aet.interview.repository;

import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.job.domain.Job;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
