package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.BadRequestException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.TimeConflictException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.dto.*;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private final JobRepository jobRepository;
    private static final ZoneId CET_TIMEZONE = ZoneId.of("Europe/Berlin");

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
                    interviewProcess.getId(),
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
            interviewProcess.getId(),
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

    /**
     * Creates and persists new interview slots for a given interview process.
     *
     * @param processId the ID of the interview process
     * @param dto the data transfer object containing slot definitions
     * @return a list of created interview slots
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException if the user is not authorized
     * @throws TimeConflictException if any time conflicts are detected
     */
    public List<InterviewSlotDTO> createSlots(UUID processId, CreateSlotsDTO dto) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> new EntityNotFoundException("InterviewProcess" + processId + "not found"));

        // 2. Security: Verify current user is the job owner
        Job job = process.getJob();
        User supervisingProfessor = job.getSupervisingProfessor();
        UUID currentUserId = currentUserService.getUserId();

        if (!supervisingProfessor.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only create slots for your own jobs");
        }

        // 3. Convert DTOs to entities
        List<InterviewSlot> newSlots = dto
            .slots()
            .stream()
            .map(slotInput -> createSlotFromInput(process, slotInput))
            .toList();

        // 4. Validate no time conflicts
        validateNoTimeConflicts(newSlots);

        // 5. Save all slots
        List<InterviewSlot> savedSlots = interviewSlotRepository.saveAll(newSlots);

        return savedSlots.stream().map(InterviewSlotDTO::fromEntity).toList();
    }

    /**
     * Converts a single {@link CreateSlotsDTO.SlotInput} entry into an {@link InterviewSlot} entity.
     * <p>
     * Combines the provided date and time values into {@link Instant}s using the Munich time zone.
     *
     * @param process the interview process the slot belongs to
     * @param input the slot definition from the frontend
     * @return a populated {@link InterviewSlot} entity ready for persistence
     */
    private InterviewSlot createSlotFromInput(InterviewProcess process, CreateSlotsDTO.SlotInput input) {
        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(process);

        // Convert LocalDate + LocalTime to Instant with Munich timezone
        ZonedDateTime startZdt = ZonedDateTime.of(input.date(), input.startTime(), CET_TIMEZONE);
        slot.setStartDateTime(startZdt.toInstant());

        ZonedDateTime endZdt = ZonedDateTime.of(input.date(), input.endTime(), CET_TIMEZONE);
        slot.setEndDateTime(endZdt.toInstant());

        slot.setLocation(input.location());
        slot.setStreamLink(input.streamLink());
        slot.setIsBooked(false);

        return slot;
    }

    /**
     * Validates that none of the new slots conflict with existing slots of the same
     * professor.
     *
     * @param newSlots the slots to validate
     * @throws TimeConflictException if a time conflict is detected
     */
    private void validateNoTimeConflicts(List<InterviewSlot> newSlots) {
        // 1. Check for internal conflicts within the new batch
        for (int i = 0; i < newSlots.size(); i++) {
            for (int j = i + 1; j < newSlots.size(); j++) {
                InterviewSlot s1 = newSlots.get(i);
                InterviewSlot s2 = newSlots.get(j);

                if (s1.getStartDateTime().isBefore(s2.getEndDateTime()) && s1.getEndDateTime().isAfter(s2.getStartDateTime())) {
                    throw new TimeConflictException(
                        String.format(
                            "Time conflict: The new slots overlap with each other (%s - %s and %s - %s)",
                            s1.getStartDateTime().atZone(CET_TIMEZONE).toLocalDateTime(),
                            s1.getEndDateTime().atZone(CET_TIMEZONE).toLocalDateTime(),
                            s2.getStartDateTime().atZone(CET_TIMEZONE).toLocalDateTime(),
                            s2.getEndDateTime().atZone(CET_TIMEZONE).toLocalDateTime()
                        )
                    );
                }
            }
        }

        // 2. Check for conflicts with existing slots in the database
        for (InterviewSlot newSlot : newSlots) {
            User professor = newSlot.getInterviewProcess().getJob().getSupervisingProfessor();

            boolean hasConflict = interviewSlotRepository.hasConflictingSlots(
                professor,
                newSlot.getStartDateTime(),
                newSlot.getEndDateTime()
            );

            if (hasConflict) {
                // Fetch conflicting InterviewSlot entity
                InterviewSlot conflictingSlot = interviewSlotRepository
                    .findFirstConflictingSlot(professor, newSlot.getStartDateTime(), newSlot.getEndDateTime())
                    .orElseThrow();

                ZonedDateTime conflictTime = conflictingSlot.getStartDateTime().atZone(CET_TIMEZONE);
                String jobTitle = conflictingSlot.getInterviewProcess().getJob().getTitle();

                throw new TimeConflictException(
                    String.format(
                        "Time conflict: You already have an interview slot at %s for job '%s'",
                        conflictTime.toLocalDateTime(),
                        jobTitle
                    )
                );
            }
        }
    }

    /**
     * Retrieves all interview slots for a given interview process.
     * Slots are returned ordered by start time (ascending).
     *
     * @param processId the ID of the interview process
     * @return a list of interview slots ordered by start time
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException if the user is not authorized to view these slots
     */
    public List<InterviewSlotDTO> getSlotsByProcessId(UUID processId) {
        // 1.Load Interview Process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> new EntityNotFoundException("InterviewProcess" + processId + "not found"));

        // 2. Security: Verify current user is the job owner
        Job job = process.getJob();
        User supervisingProfessor = job.getSupervisingProfessor();
        UUID currentUserId = currentUserService.getUserId();

        if (!supervisingProfessor.getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only create slots for your own jobs");
        }

        // 3. Load and return slots
        List<InterviewSlot> slots = interviewSlotRepository.findByInterviewProcessIdOrderByStartDateTime(processId);

        return slots.stream().map(InterviewSlotDTO::fromEntity).toList();
    }

    /**
     * Deletes a single interview slot.
     * Only unbooked slots can be deleted.
     *
     * @param slotId the ID of the slot to delete
     * @throws EntityNotFoundException if the slot is not found
     * @throws AccessDeniedException if the user is not authorized to delete this slot
     * @throws BadRequestException if the slot is booked
     */
    public void deleteSlot(UUID slotId) {
        // 1. Load the slot
        InterviewSlot slot = interviewSlotRepository
            .findById(slotId)
            .orElseThrow(() -> {
                return new EntityNotFoundException("Slot " + slotId + " not found");
            });

        // 3.Cannot delete booked slots
        // TODO: Implement deletion of booked slots with unassignment of applicant
        if (slot.getIsBooked()) {
            throw new BadRequestException("Cannot delete booked slot.");
        }

        // 4. Delete the slot
        interviewSlotRepository.delete(slot);
    }
}
