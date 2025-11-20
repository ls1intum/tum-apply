package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewProcessDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private final JobRepository jobRepository;

    /**
     * Get overview of all interview processes with statistics per job.
     * Returns a list of jobs that have an active interview process with counts
     * of applications in each state (completed, scheduled, invited, uncontacted).
     * <p>
     * <p>
     * TODO: This implementation uses ApplicationState to track interview status.
     * Future improvement: Create separate InterviewInvitation entity to better
     * separate application review process from interview process.
     *
     * @return list of interview overview DTOs with statistics
     */

    public List<InterviewOverviewDTO> getInterviewOverview() {
        // 1. Get the ID of the currently logged-in professor
        UUID professorId = currentUserService.getUserId();

        //2. Load all active interview processes for this professor
        List<InterviewProcess> interviewProcesses = interviewProcessRepository.findAllByProfessorId(professorId);

        // 2. If no interview processes exist, return an empty list
        if (interviewProcesses.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. Fetch aggregated data: count of applications per job and ApplicationState
        List<Object[]> countResults = applicationRepository.countApplicationsByJobAndStateForInterviewProcesses(professorId);

        // 5.Build a map structure with jobId as key
        // The inner map contains the count of applications per ApplicationState
        Map<UUID, Map<ApplicationState, Long>> countsPerJobAndState = new HashMap<>();

        // 6. Process the results and organize them into the map structure
        for (Object[] result : countResults) {
            Job job = (Job) result[0];
            ApplicationState state = (ApplicationState) result[1];
            Long count = (Long) result[2];

            countsPerJobAndState.computeIfAbsent(job.getJobId(), k -> new EnumMap<>(ApplicationState.class)).put(state, count);
        }

        // 7.Transform each interview process into a DTO with statistical data
        return interviewProcesses
            .stream()
            .map(interviewProcess -> {
                Job job = interviewProcess.getJob();
                UUID jobId = job.getJobId();

                // Get the state counts for this job (or an empty map if no data exists)
                Map<ApplicationState, Long> stateCounts = countsPerJobAndState.getOrDefault(jobId, Collections.emptyMap());

                // Count applications in interview specific states
                // COMPLETED: Interview has been completed
                long completedCount = stateCounts.getOrDefault(ApplicationState.COMPLETED, 0L);

                // SCHEDULED: Interview appointment has been scheduled
                long scheduledCount = stateCounts.getOrDefault(ApplicationState.SCHEDULED, 0L);

                // INVITED: Candidate has been invited to interview, but no appointment yet
                long invitedCount = stateCounts.getOrDefault(ApplicationState.INVITED, 0L);

                // TODO: Replace with InterviewInvitation entity lookup
                // Calculate "uncontacted" - applications that haven't been invited to interview yet
                // Currently: uncontacted = applications not yet moved to interview process
                // These states represent applications that are still in the review process (or submitted applications) but have not yet transitioned to the interview phase
                // Future: uncontacted = applications explicitly added to interview but not invited
                long uncontactedCount =
                    stateCounts.getOrDefault(ApplicationState.IN_REVIEW, 0L) + // Application is being reviewed
                    stateCounts.getOrDefault(ApplicationState.SENT, 0L); // Application has been submitted

                // Calculate total number of all applications in this interview process
                long totalInterviews = completedCount + scheduledCount + invitedCount + uncontactedCount;

                // Create the DTO with all statistical data for the UI
                return new InterviewOverviewDTO(
                    jobId,
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
     * Get details for a single interview process.
     *
     * @param processId the ID of the interview process
     * @return the {@link InterviewOverviewDTO} with statistics
     * @throws EntityNotFoundException if the process is not found
     */
    public InterviewOverviewDTO getInterviewProcessDetails(UUID processId) {
        // 1. Load the interview process
        InterviewProcess interviewProcess = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> new EntityNotFoundException("InterviewProcess " + processId + " not found"));

        // 2. Security: Verify current user is the job owner
        UUID currentUserId = currentUserService.getUserId();

        // Extract job and professor to avoid long get-chain
        Job job = interviewProcess.getJob();
        User supervisingProfessor = job.getSupervisingProfessor();
        UUID professorUserId = supervisingProfessor.getUserId();

        // Security check: Only job owner can view their interview processes
        if (!professorUserId.equals(currentUserId)) {
            throw new AccessDeniedException("You can only view your own interview processes");
        }

        // 3. Fetch aggregated data for this specific job
        UUID jobId = interviewProcess.getJob().getJobId();
        List<Object[]> countResults = applicationRepository.countApplicationsByJobAndStateForInterviewProcesses(currentUserId);

        // Filter for this specific job (optimization: could add a specific repository method, but this reuses existing logic)
        Map<ApplicationState, Long> stateCounts = new EnumMap<>(ApplicationState.class);
        for (Object[] result : countResults) {
            job = (Job) result[0];
            if (job.getJobId().equals(jobId)) {
                ApplicationState state = (ApplicationState) result[1];
                Long count = (Long) result[2];
                stateCounts.put(state, count);
            }
        }

        // 4. Calculate stats
        long completedCount = stateCounts.getOrDefault(ApplicationState.COMPLETED, 0L);
        long scheduledCount = stateCounts.getOrDefault(ApplicationState.SCHEDULED, 0L);
        long invitedCount = stateCounts.getOrDefault(ApplicationState.INVITED, 0L);
        long uncontactedCount =
            stateCounts.getOrDefault(ApplicationState.IN_REVIEW, 0L) + stateCounts.getOrDefault(ApplicationState.SENT, 0L);
        long totalInterviews = completedCount + scheduledCount + invitedCount + uncontactedCount;

        return new InterviewOverviewDTO(
            jobId,
            interviewProcess.getJob().getTitle(),
            completedCount,
            scheduledCount,
            invitedCount,
            uncontactedCount,
            totalInterviews
        );
    }

    /**
     * Creates an interview process for a job (called automatically when job is published).
     * This is called from JobService, so security checks are already done.
     *
     * @param jobId the ID of the job for which to create the interview process
     * @return the created InterviewProcessDTO, or null if one already exists
     */

    public InterviewProcessDTO createInterviewProcessForJob(UUID jobId) {
        Optional<InterviewProcess> existing = interviewProcessRepository.findByJobJobId(jobId);

        if (existing.isPresent()) {
            return mapToDTO(existing.get());
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
