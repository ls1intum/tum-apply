package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.dto.CreateInterviewProcessDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewProcessDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<InterviewOverviewDTO> getInterviewOverview() {
        UUID professorId = currentUserService.getUserId();

        List<InterviewProcess> interviewProcesses = interviewProcessRepository.findAllByProfessorId(professorId);

        if (interviewProcesses.isEmpty()) {
            return Collections.emptyList();
        }

        List<Object[]> countResults = applicationRepository.countApplicationsByJobAndStateForInterviewProcesses(
            professorId
        );

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
                Map<ApplicationState, Long> stateCounts = countsPerJobAndState.getOrDefault(
                    job,
                    Collections.emptyMap()
                );

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

    @Transactional
    public InterviewProcessDTO createInterviewProcess(CreateInterviewProcessDTO dto) {
        UUID professorId = currentUserService.getUserId();

        Job job = jobRepository
            .findById(dto.jobId())
            .orElseThrow(() -> new EntityNotFoundException("Job not found with id: " + dto.jobId()));

        if (!job.getSupervisingProfessor().getUserId().equals(professorId)) {
            throw new AccessDeniedException("You can only create interview processes for your own jobs");
        }

        return interviewProcessRepository
            .findByJob(job)
            .map(this::mapToDTO)
            .orElseGet(() -> {
                InterviewProcess interviewProcess = new InterviewProcess();
                interviewProcess.setJob(job);

                InterviewProcess saved = interviewProcessRepository.save(interviewProcess);
                return mapToDTO(saved);
            });
    }

    private InterviewProcessDTO mapToDTO(InterviewProcess interviewProcess) {
        return new InterviewProcessDTO(
            interviewProcess.getId(),
            interviewProcess.getJob().getJobId(),
            interviewProcess.getJob().getTitle(),
            interviewProcess.getCreatedAt()
        );
    }
}
