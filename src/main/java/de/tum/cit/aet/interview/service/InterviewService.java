package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.service.UserService;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;

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
}
