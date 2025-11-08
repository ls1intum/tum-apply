package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewProcessDTO;
import de.tum.cit.aet.interview.dto.InterviewStatisticsDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import java.util.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for managing interview processes and providing overview statistics.
 * This service handles the creation and retrieval of interview processes for professors,
 * including aggregated statistics about application states across different interview stages.
 */
@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;

    /**
     * Retrieves an overview of all interview processes for the currently authenticated professor.
     * This method aggregates application counts by state for each interview process,
     * categorizing them into:
     * - Completed: Applications in COMPLETED state
     * - Scheduled: Applications in SCHEDULED state
     * - Invited: Applications in INVITED state
     * - Uncontacted: Applications in IN_REVIEW, SENT, or ACCEPTED states
     *
     * @return List of {@link InterviewOverviewDTO} containing interview statistics for each job
     * @throws org.springframework.security.access.AccessDeniedException if user is not authenticated
     */
    public List<InterviewOverviewDTO> getInterviewOverview() {
        UUID professorId = currentUserService.getUserId();

        List<InterviewProcess> interviewProcesses = interviewProcessRepository.findAllByProfessorId(professorId);

        if (interviewProcesses.isEmpty()) {
            return Collections.emptyList();
        }

        List<InterviewStatisticsDTO> statistics = applicationRepository.getInterviewStatistics(professorId);

        Map<UUID, Map<ApplicationState, Long>> countsPerJobAndState = new HashMap<>();

        for (InterviewStatisticsDTO stat : statistics) {
            countsPerJobAndState.computeIfAbsent(stat.jobId(), k -> new EnumMap<>(ApplicationState.class)).put(stat.state(), stat.count());
        }

        return interviewProcesses
            .stream()
            .map(interviewProcess -> {
                Job job = interviewProcess.getJob();
                Map<ApplicationState, Long> stateCounts = countsPerJobAndState.getOrDefault(job.getJobId(), Collections.emptyMap());

                long completedCount = stateCounts.getOrDefault(ApplicationState.COMPLETED, 0L);
                long scheduledCount = stateCounts.getOrDefault(ApplicationState.SCHEDULED, 0L);
                long invitedCount = stateCounts.getOrDefault(ApplicationState.INVITED, 0L);

                long uncontactedCount =
                    stateCounts.getOrDefault(ApplicationState.IN_REVIEW, 0L) +
                    stateCounts.getOrDefault(ApplicationState.SENT, 0L) +
                    stateCounts.getOrDefault(ApplicationState.ACCEPTED, 0L);

                long totalInterviews = completedCount + scheduledCount + invitedCount + uncontactedCount;

                return new InterviewOverviewDTO(
                    job.getJobId(),
                    job.getTitle(),
                    completedCount,
                    scheduledCount,
                    invitedCount,
                    uncontactedCount,
                    totalInterviews
                );
            })
            .toList();
    }

    /**
     * Creates an interview process for a job (called automatically when job is published).
     * This is called from JobService, so security checks are already done.
     *
     * @param jobId the ID of the job for which to create the interview process
     * @return the created InterviewProcessDTO, or null if one already exists
     */
    @Transactional
    public InterviewProcessDTO createInterviewProcessForJob(UUID jobId) {
        // Check if process already exists
        if (interviewProcessRepository.existsByJobJobId(jobId)) {
            return null; // Already exists, do nothing
        }

        // Load the job
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));

        // Create new process
        InterviewProcess interviewProcess = new InterviewProcess();
        interviewProcess.setJob(job);

        InterviewProcess saved = interviewProcessRepository.save(interviewProcess);
        return mapToDTO(saved);
    }

    /**
     * Maps an {@link InterviewProcess} entity to its corresponding DTO representation.
     *
     * @param interviewProcess the interview process entity to map
     * @return {@link InterviewProcessDTO} containing the interview process data
     */
    private InterviewProcessDTO mapToDTO(InterviewProcess interviewProcess) {
        return new InterviewProcessDTO(
            interviewProcess.getId(),
            interviewProcess.getJob().getJobId(),
            interviewProcess.getJob().getTitle(),
            interviewProcess.getCreatedAt()
        );
    }
}
