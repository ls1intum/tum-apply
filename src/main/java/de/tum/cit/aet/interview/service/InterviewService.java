package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.job.domain.Job;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private static final ZoneId MUNICH_ZONE = ZoneId.of("Europe/Berlin");

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
     * Create interview slots from frontend-generated definitions.
     * Frontend handles slot generation - backend only validates and saves.
     */
    public List<InterviewSlotDTO> createSlots(UUID processId, CreateSlotsDTO dto) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository.findById(processId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Interview process not found"
            ));

        // 2. Security: Check if current user is the job owner
        UUID currentUserId = currentUserService.getUserId();

        if (!process.getJob().getSupervisingProfessor().getUserId().equals(currentUserId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You can only create slots for your own jobs"
            );
        }

        // 3. Convert DTOs to entities
        List<InterviewSlot> newSlots = dto.slots().stream()
            .map(slotInput -> createSlotFromInput(process, slotInput))
            .toList();

        // 4. Validate no time conflicts with professor's other interview processes
        validateNoTimeConflicts(currentUserId, newSlots);

        // 5. Save all slots
        List<InterviewSlot> savedSlots = interviewSlotRepository.saveAll(newSlots);

        return savedSlots.stream()
            .map(InterviewSlotDTO::fromEntity)
            .toList();
    }

    /**
     * Convert SlotInput to InterviewSlot entity
     */
    private InterviewSlot createSlotFromInput(InterviewProcess process, CreateSlotsDTO.SlotInput input) {
        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(process);

        // Convert LocalDate + LocalTime to Instant with Munich timezone
        ZonedDateTime startZdt = ZonedDateTime.of(input.date(), input.startTime(), MUNICH_ZONE);
        slot.setStartDateTime(startZdt.toInstant());

        ZonedDateTime endZdt = ZonedDateTime.of(input.date(), input.endTime(), MUNICH_ZONE);
        slot.setEndDateTime(endZdt.toInstant());

        slot.setLocation(input.location());
        slot.setStreamLink(input.streamLink());
        slot.setIsBooked(false);

        return slot;
    }

    /**
     * Validate that professor has no other slots at the same time
     */
    private void validateNoTimeConflicts(UUID professorId, List<InterviewSlot> newSlots) {
        for (InterviewSlot newSlot : newSlots) {
            List<InterviewSlot> conflictingSlots = interviewSlotRepository
                .findConflictingSlotsForProfessor(
                    professorId,
                    newSlot.getStartDateTime(),
                    newSlot.getEndDateTime()
                );

            if (!conflictingSlots.isEmpty()) {
                InterviewSlot conflict = conflictingSlots.get(0);
                ZonedDateTime conflictTime = conflict.getStartDateTime().atZone(MUNICH_ZONE);

                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    String.format(
                        "Time conflict: You already have an interview slot at %s for job '%s'",
                        conflictTime.toLocalDateTime(),
                        conflict.getInterviewProcess().getJob().getTitle()
                    )
                );
            }
        }
    }
}
