package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.job.domain.Job;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

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
        // 1. Get all jobs with an interview process
        List<InterviewProcess> interviewProcesses = interviewProcessRepository.findAll();

        // 2. For each job, count applications by state
        return interviewProcesses
            .stream()
            .map(interviewProcess -> {
                Job job = interviewProcess.getJob();

                // Count applications for this job by state
                long completedCount = applicationRepository.countByJobAndState(job, ApplicationState.COMPLETED);
                long scheduledCount = applicationRepository.countByJobAndState(job, ApplicationState.SCHEDULED);
                long invitedCount = applicationRepository.countByJobAndState(job, ApplicationState.INVITED);

                // TODO: Replace with InterviewInvitation entity lookup
                // Currently: uncontacted = applications not yet moved to interview process
                // Future: uncontacted = applications explicitly added to interview but not invited
                long uncontactedCount = applicationRepository.countByJobAndStateIn(
                    job,
                    List.of(ApplicationState.IN_REVIEW, ApplicationState.SENT, ApplicationState.ACCEPTED)
                );

                long totalInterviews = completedCount + scheduledCount + invitedCount + uncontactedCount;

                // 3. Create DTO
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
}
