package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.job.domain.Job;
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

@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final ApplicationRepository applicationRepository;

    /**
     * Get overview of all interview processes with statistics per job.
     * Returns a list of jobs that have an active interview process with counts
     * of applications in each state (completed, scheduled, invited, uncontacted).
     *

     * TODO: This implementation uses ApplicationState to track interview status.
     * Future improvement: Create separate InterviewInvitation entity to better
     * separate application review process from interview process.
     *
     * @return list of interview overview DTOs with statistics
     */

    public List<InterviewOverviewDTO> getInterviewOverview() {
        UUID professorId = getCurrentUserId();

        List<InterviewProcess> interviewProcesses = interviewProcessRepository.findAllByProfessorId(professorId);

        if (interviewProcesses.isEmpty()) {
            return Collections.emptyList();
        }

        List<Object[]> countResults = applicationRepository.countApplicationsByJobAndStateForInterviewProcesses(professorId);

        Map<Job, Map<ApplicationState, Long>> countsPerJobAndState = new HashMap<>();

        for (Object[] result : countResults) {
            Job job = (Job) result[0];
            ApplicationState state = (ApplicationState) result[1];
            Long count = (Long) result[2];

            countsPerJobAndState.computeIfAbsent(job, k -> new EnumMap<>(ApplicationState.class)).put(state, count);
        }

        return interviewProcesses
            .stream()
            .map(interviewProcess -> {
                Job job = interviewProcess.getJob();
                Map<ApplicationState, Long> stateCounts = countsPerJobAndState.getOrDefault(job, Collections.emptyMap());

                // Get counts for interview-specific states
                long completedCount = stateCounts.getOrDefault(ApplicationState.COMPLETED, 0L);
                long scheduledCount = stateCounts.getOrDefault(ApplicationState.SCHEDULED, 0L);
                long invitedCount = stateCounts.getOrDefault(ApplicationState.INVITED, 0L);

                // TODO: Replace with InterviewInvitation entity lookup
                // Currently: uncontacted = applications not yet moved to interview process
                // Future: uncontacted = applications explicitly added to interview but not invited
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
     * Gets the currently authenticated user's ID from the Spring Security context.
     *
     * @return the UUID of the authenticated user
     * @throws IllegalStateException if no user is authenticated
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }
        // Assuming the principal is a UUID or can be converted to UUID
        // Adjust this based on your actual UserDetails implementation
        return UUID.fromString(authentication.getName());
    }
}
