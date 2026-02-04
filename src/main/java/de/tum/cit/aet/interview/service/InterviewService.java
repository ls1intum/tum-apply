package de.tum.cit.aet.interview.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.BadRequestException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.exception.TimeConflictException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;
import de.tum.cit.aet.interview.dto.*;
import de.tum.cit.aet.interview.dto.IntervieweeState;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.User;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@AllArgsConstructor
@Service
public class InterviewService {

    private final InterviewProcessRepository interviewProcessRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private final JobRepository jobRepository;
    private final AsyncEmailSender asyncEmailSender;
    private final IcsCalendarService icsCalendarService;
    private final DocumentDictionaryService documentDictionaryService;
    private static final ZoneId CET_TIMEZONE = ZoneId.of("Europe/Berlin");

    /*--------------------------------------------------------------
     Interview Process Overview and Management
    --------------------------------------------------------------*/

    /**
     * Get overview of all interview processes with statistics per job.
     * Returns a list of jobs that have an active interview process with counts of
     * applications in each state (completed, scheduled, invited, uncontacted).
     *
     * TODO: This implementation uses IntervieweeState to track interview status.
     *
     * @return list of interview overview DTOs with statistics
     */

    public List<InterviewOverviewDTO> getInterviewOverview() {
        // 1. Get the ID of the currently logged-in professor
        UUID professorId = currentUserService.getUserId();

        // 2. Load all active interview processes for this professor
        List<InterviewProcess> interviewProcesses = interviewProcessRepository.findAllByProfessorId(professorId);

        // 3. If no interview processes exist, return an empty list
        if (interviewProcesses.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. Fetch all interviewees for these processes in a single query
        List<UUID> processIds = interviewProcesses.stream().map(InterviewProcess::getId).toList();
        List<Interviewee> allInterviewees = intervieweeRepository.findByInterviewProcessIdInWithSlots(processIds);

        // 5. Group interviewees by process ID and calculate state counts
        Map<UUID, Map<IntervieweeState, Long>> countsPerProcess = allInterviewees
            .stream()
            .collect(
                Collectors.groupingBy(
                    interviewee -> interviewee.getInterviewProcess().getId(),
                    Collectors.groupingBy(
                        this::calculateIntervieweeState,
                        () -> new EnumMap<>(IntervieweeState.class),
                        Collectors.counting()
                    )
                )
            );

        // 6. Transform each interview process into a DTO with statistical data
        return interviewProcesses
            .stream()
            .map(interviewProcess -> {
                Job job = interviewProcess.getJob();
                UUID jobId = job.getJobId();
                UUID processId = interviewProcess.getId();

                // Get the state counts for this process (or an empty map if no data exists)
                Map<IntervieweeState, Long> stateCounts = countsPerProcess.getOrDefault(processId, Collections.emptyMap());

                // Count interviewees by state
                long completedCount = stateCounts.getOrDefault(IntervieweeState.COMPLETED, 0L);
                long scheduledCount = stateCounts.getOrDefault(IntervieweeState.SCHEDULED, 0L);
                long invitedCount = stateCounts.getOrDefault(IntervieweeState.INVITED, 0L);
                long uncontactedCount = stateCounts.getOrDefault(IntervieweeState.UNCONTACTED, 0L);

                // Calculate total number of all interviewees in this interview process
                // Only count interviewees who have a decided slot (SCHEDULED or COMPLETED)
                long totalInterviews = completedCount + scheduledCount;

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
     * Retrieves upcoming booked interviews for the currently logged-in professor.
     * Shows strictly TODAY + FUTURE booked interviews from all jobs of the
     * professor.
     *
     * @return list of {@link UpcomingInterviewDTO} for the dashboard
     */
    public List<UpcomingInterviewDTO> getUpcomingInterviews() {
        // 1. Get current professor ID
        UUID professorId = currentUserService.getUserId();

        // 2. Fetch upcoming slots (pagination max 5)
        Pageable limit = PageRequest.of(0, 5);
        Page<InterviewSlot> slots = interviewSlotRepository.findUpcomingBookedSlotsForProfessor(professorId, Instant.now(), limit);

        // 3. Map to DTO
        return slots
            .stream()
            .map(slot -> {
                Interviewee interviewee = slot.getInterviewee();
                // safe check
                if (interviewee == null) {
                    return null;
                }

                User applicantUser = interviewee.getApplication().getApplicant().getUser();
                String applicantName = applicantUser.getFirstName() + " " + applicantUser.getLastName();

                return new UpcomingInterviewDTO(
                    slot.getId(),
                    slot.getStartDateTime(),
                    slot.getEndDateTime(),
                    applicantName,
                    slot.getInterviewProcess().getJob().getTitle(),
                    slot.getLocation(),
                    slot.getInterviewProcess().getId(),
                    interviewee.getId()
                );
            })
            .filter(java.util.Objects::nonNull)
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

        // 2. Security: Verify current user has job access
        Job job = interviewProcess.getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Fetch interviewees for this process and calculate state counts
        List<Interviewee> interviewees = intervieweeRepository.findByInterviewProcessIdInWithSlots(List.of(processId));

        Map<IntervieweeState, Long> stateCounts = new EnumMap<>(IntervieweeState.class);
        for (Interviewee interviewee : interviewees) {
            IntervieweeState state = calculateIntervieweeState(interviewee);
            stateCounts.merge(state, 1L, Long::sum);
        }

        // 4. Calculate stats
        long completedCount = stateCounts.getOrDefault(IntervieweeState.COMPLETED, 0L);
        long scheduledCount = stateCounts.getOrDefault(IntervieweeState.SCHEDULED, 0L);
        long invitedCount = stateCounts.getOrDefault(IntervieweeState.INVITED, 0L);
        long uncontactedCount = stateCounts.getOrDefault(IntervieweeState.UNCONTACTED, 0L);
        long totalInterviews = completedCount + scheduledCount;

        return new InterviewOverviewDTO(
            job.getJobId(),
            interviewProcess.getId(),
            job.getTitle(),
            completedCount,
            scheduledCount,
            invitedCount,
            uncontactedCount,
            totalInterviews
        );
    }

    /**
     * Creates an interview process for a job (called automatically when job is
     * published).
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
     * Maps an {@link InterviewProcess} entity to its corresponding DTO
     * representation.
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

    /*--------------------------------------------------------------
     Interview Slot and Interviewee Management
    --------------------------------------------------------------*/

    /**
     * Creates and persists new interview slots for a given interview process.
     *
     * @param processId the ID of the interview process
     * @param dto       the data transfer object containing slot definitions
     * @return a list of created interview slots
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized
     * @throws TimeConflictException   if any time conflicts are detected
     */
    public List<InterviewSlotDTO> createSlots(UUID processId, CreateSlotsDTO dto) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> new EntityNotFoundException("InterviewProcess" + processId + "not found"));

        // 2. Security: Verify current user has job access
        Job job = process.getJob();
        currentUserService.verifyJobAccess(job);
        User professor = job.getSupervisingProfessor();

        // 3. Convert DTOs to entities
        List<InterviewSlot> newSlots = dto
            .slots()
            .stream()
            .map(slotInput -> createSlotFromInput(process, slotInput))
            .toList();

        // 4. Validate no time conflicts (pass professor to avoid lazy loading)
        validateNoTimeConflicts(newSlots, professor, processId);

        // 5. Save all slots
        List<InterviewSlot> savedSlots = interviewSlotRepository.saveAll(newSlots);

        return savedSlots.stream().map(InterviewSlotDTO::fromEntity).toList();
    }

    /**
     * Converts a single {@link CreateSlotsDTO.SlotInput} entry into an
     * {@link InterviewSlot} entity.
     * <p>
     * Combines the provided date and time values into {@link Instant}s using the
     * Munich time zone.
     *
     * @param process the interview process the slot belongs to
     * @param input   the slot definition from the client
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
     * Deletes a single interview slot.
     * Only unbooked slots can be deleted.
     *
     * @param slotId the ID of the slot to delete
     * @throws EntityNotFoundException if the slot is not found
     * @throws AccessDeniedException   if the user is not authorized to delete this
     *                                 slot
     * @throws BadRequestException     if the slot is booked
     */
    public void deleteSlot(UUID slotId) {
        // 1. Load the slot
        InterviewSlot slot = interviewSlotRepository
            .findByIdWithJob(slotId)
            .orElseThrow(() -> new EntityNotFoundException("Slot " + slotId + " not found"));

        // 2. Security: Verify current user has job access
        Job job = slot.getInterviewProcess().getJob();
        currentUserService.verifyJobAccess(job);

        // 3.Cannot delete booked slots
        // TODO: Implement deletion of booked slots with unassignment of applicant
        if (slot.getIsBooked()) {
            throw new BadRequestException("Cannot delete booked slot.");
        }

        // 4. Delete the slot
        interviewSlotRepository.delete(slot);
    }

    /**
     * Validates that none of the new slots conflict with existing slots of the same
     * professor.
     * For the same process: blocks any overlapping slot.
     * For other processes: only blocks BOOKED overlapping slots.
     *
     * @param newSlots  the slots to validate
     * @param professor the supervising professor (passed to avoid lazy loading)
     * @param processId the current interview process ID
     * @throws TimeConflictException if a time conflict is detected
     */
    private void validateNoTimeConflicts(List<InterviewSlot> newSlots, User professor, UUID processId) {
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
        // Same process: any overlap blocks; Other processes: only BOOKED slots block
        for (InterviewSlot newSlot : newSlots) {
            boolean hasConflict = interviewSlotRepository.hasConflictingSlots(
                professor,
                processId,
                newSlot.getStartDateTime(),
                newSlot.getEndDateTime()
            );

            if (hasConflict) {
                // Fetch conflicting InterviewSlot entity to provide details
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
     * Retrieves interview slots for a given interview process with optional month
     * filtering.
     * If year and month are provided, returns only slots within that month.
     * Otherwise, returns all slots for the process.
     * Slots are returned ordered by start time (ascending).
     *
     * @param processId the ID of the interview process
     * @param year      optional year to filter by (e.g., 2025)
     * @param month     optional month to filter by (1-12)
     * @param pageDTO   pagination information
     * @return a page of interview slots ordered by start time
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized to view these
     *                                 slots
     */
    public PageResponseDTO<InterviewSlotDTO> getSlotsByProcessId(UUID processId, Integer year, Integer month, PageDTO pageDTO) {
        // 1. Load Interview Process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> new EntityNotFoundException("InterviewProcess " + processId + " not found"));

        // 2. Security: Verify current user has job access
        Job job = process.getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Convert PageDTO to Pageable
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());

        // 4. Query slots - with or without month filter
        Page<InterviewSlot> slotsPage;
        if (year != null && month != null) {
            ZonedDateTime monthStart = ZonedDateTime.of(year, month, 1, 0, 0, 0, 0, CET_TIMEZONE);
            ZonedDateTime monthEnd = monthStart.plusMonths(1);
            slotsPage = interviewSlotRepository.findByProcessIdAndMonth(processId, monthStart.toInstant(), monthEnd.toInstant(), pageable);
        } else {
            slotsPage = interviewSlotRepository.findByInterviewProcessId(processId, pageable);
        }

        // 5. Convert to DTOs (using rich mapping logic)
        List<InterviewSlotDTO> slotDTOs = slotsPage
            .getContent()
            .stream()
            .map(slot -> {
                if (slot.getInterviewee() != null) {
                    Interviewee interviewee = slot.getInterviewee();
                    IntervieweeState state = slot.getEndDateTime().isBefore(Instant.now())
                        ? IntervieweeState.COMPLETED
                        : IntervieweeState.SCHEDULED;
                    AssignedIntervieweeDTO assignedInterviewee = AssignedIntervieweeDTO.fromEntity(interviewee, state);
                    return InterviewSlotDTO.fromEntity(slot, assignedInterviewee);
                }
                return InterviewSlotDTO.fromEntity(slot);
            })
            .toList();

        return new PageResponseDTO<>(slotDTOs, slotsPage.getTotalElements());
    }

    /**
     * Retrieves conflict data for slot creation validation on a specific date.
     * Returns all slots relevant for conflict detection in a single response:
     * - All slots (booked + unbooked) from the current process
     * - All BOOKED slots from other processes of the same professor
     *
     * @param processId the ID of the interview process
     * @param date      the date to check for conflicts
     * @return ConflictDataDTO containing slots for client-side conflict detection
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    public ConflictDataDTO getConflictDataForDate(UUID processId, LocalDate date) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> EntityNotFoundException.forId("InterviewProcess", processId));

        // 2. Security: Verify current user has job access
        currentUserService.verifyJobAccess(process.getJob());

        // 3. Calculate day boundaries in CET timezone
        UUID professorId = process.getJob().getSupervisingProfessor().getUserId();
        Instant dayStart = date.atStartOfDay(CET_TIMEZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(CET_TIMEZONE).toInstant();

        // 4. Fetch all relevant slots for conflict detection
        List<InterviewSlot> slots = interviewSlotRepository.findConflictDataByDate(processId, professorId, dayStart, dayEnd);

        // 5. Return DTO for client-side filtering
        return new ConflictDataDTO(processId, slots.stream().map(ConflictDataDTO.ExistingSlotDTO::fromEntity).toList());
    }

    /*--------------------------------------------------------------
     Interviewee Management
    --------------------------------------------------------------*/

    /**
     * Adds applicants to an interview process by creating Interviewee entities.
     * Skips duplicates - if an applicant is already added, they are not added
     * again.
     *
     * - Only the job owner (supervising professor and employees) can add applicants
     * - All applications must belong to the same job as the interview process
     * - Duplicate entries are silently skipped (idempotent operation)
     *
     * @param processId the ID of the interview process
     * @param dto       containing the list of application IDs to add
     * @return list of newly created IntervieweeDTOs (excludes duplicates)
     * @throws EntityNotFoundException if the process or any application is not
     *                                 found
     * @throws AccessDeniedException   if the user is not the job owner
     * @throws BadRequestException     if any application belongs to a different job
     */
    @Transactional
    public List<IntervieweeDTO> addApplicantsToInterview(UUID processId, AddIntervieweesDTO dto) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> EntityNotFoundException.forId("Interview process", processId));

        // 2. Security: Verify current user has job access
        Job job = process.getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Load all applications
        List<Application> applications = applicationRepository.findAllById(dto.applicationIds());

        // 5. Create Interviewees (skip if already exists)
        List<Interviewee> createdInterviewees = new ArrayList<>();
        for (Application application : applications) {
            // Check if already exists
            if (!intervieweeRepository.existsByApplicationAndInterviewProcess(application, process)) {
                // Create new Interviewee
                Interviewee interviewee = new Interviewee();
                interviewee.setInterviewProcess(process);
                interviewee.setApplication(application);
                interviewee.setLastInvited(null);

                createdInterviewees.add(interviewee);
            }

            // Always update application status to INTERVIEW
            if (application.getState() != ApplicationState.INTERVIEW) {
                application.setState(ApplicationState.INTERVIEW);
            }
        }

        // 6. Save all applications and interviewees
        applicationRepository.saveAll(applications);
        List<Interviewee> savedInterviewees = intervieweeRepository.saveAll(createdInterviewees);

        // 7. Return DTOs
        return savedInterviewees.stream().map(this::mapIntervieweeToDTO).toList();
    }

    /**
     * Retrieves all interviewees for a given interview process.
     *
     *
     * @param processId the ID of the interview process
     * @return list of interviewees with their details
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    public List<IntervieweeDTO> getIntervieweesByProcessId(UUID processId) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> EntityNotFoundException.forId("Interview process", processId));

        // 2. Security: Verify current user has job access
        Job job = process.getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Load and return interviewees with details
        List<Interviewee> interviewees = intervieweeRepository.findByInterviewProcessIdWithDetails(processId);

        return interviewees.stream().map(this::mapIntervieweeToDTO).toList();
    }

    /**
     * Assigns an interviewee to an interview slot.
     *
     * @param slotId        the ID of the slot to assign
     * @param applicationId the ID of the application whose interviewee should be
     *                      assigned
     * @return the updated slot as DTO with interviewee details
     * @throws EntityNotFoundException        if slot or interviewee not found
     * @throws AccessDeniedException          if user doesn't have job access
     * @throws ResourceAlreadyExistsException if slot is already booked
     * @throws BadRequestException            if interviewee already has a slot
     */
    @Transactional
    public InterviewSlotDTO assignSlotToInterviewee(UUID slotId, UUID applicationId) {
        // 1. Load the slot with job for security check
        InterviewSlot slot = interviewSlotRepository
            .findByIdWithJob(slotId)
            .orElseThrow(() -> EntityNotFoundException.forId("Interview slot", slotId));

        // 2. Security: Verify current user has job access
        Job job = slot.getInterviewProcess().getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Check if slot is already booked
        if (slot.getIsBooked()) {
            throw new ResourceAlreadyExistsException("Interview slot is already booked");
        }

        // 4. Find the interviewee by application ID within this interview process
        UUID processId = slot.getInterviewProcess().getId();
        Interviewee interviewee = intervieweeRepository
            .findByApplicationApplicationIdAndInterviewProcessId(applicationId, processId)
            .orElseThrow(() ->
                new EntityNotFoundException("Applicant not found in this interview process. Please add the applicant first.")
            );

        // 5. interviewee must not already have a slot
        if (interviewee.hasSlot()) {
            throw new BadRequestException("Applicant already has a scheduled interview slot.");
        }

        // 6. Establish bidirectional relationship
        slot.setInterviewee(interviewee);
        slot.setIsBooked(true);
        interviewee.getSlots().add(slot);

        // 7. Auto-delete overlapping unbooked slots from other processes
        UUID professorId = job.getSupervisingProfessor().getUserId();
        List<InterviewSlot> overlappingSlots = interviewSlotRepository.findOverlappingUnbookedSlots(
            professorId,
            processId,
            slot.getStartDateTime(),
            slot.getEndDateTime()
        );

        boolean hadOverlappingSlots = !overlappingSlots.isEmpty();
        if (hadOverlappingSlots) {
            interviewSlotRepository.deleteAll(overlappingSlots);
        }

        // 8. Save entities
        interviewSlotRepository.save(slot);
        intervieweeRepository.save(interviewee);

        // 9. Send interview invitation email
        sendInterviewInvitationEmail(slot, interviewee, job);

        // 10. Build response with interviewee details
        IntervieweeState state = calculateIntervieweeState(interviewee);
        AssignedIntervieweeDTO assignedInterviewee = AssignedIntervieweeDTO.fromEntity(interviewee, state);
        return InterviewSlotDTO.fromEntity(slot, assignedInterviewee);
    }

    private void sendInterviewInvitationEmail(InterviewSlot slot, Interviewee interviewee, Job job) {
        Application application = interviewee.getApplication();
        User applicant = application.getApplicant().getUser();
        User professor = job.getSupervisingProfessor();

        String icsContent = icsCalendarService.generateIcsContent(slot, job);
        String icsFileName = icsCalendarService.generateFileName(slot);

        // Email to Applicant (with ICS)
        Email applicantEmail = Email.builder()
            .to(applicant)
            .emailType(EmailType.INTERVIEW_INVITATION)
            .language(Language.fromCode(applicant.getSelectedLanguage()))
            .researchGroup(job.getResearchGroup())
            .content(slot)
            .icsContent(icsContent)
            .icsFileName(icsFileName)
            .build();
        asyncEmailSender.sendAsync(applicantEmail);

        // Email to Professor (confirmation with ICS)
        Email professorEmail = Email.builder()
            .to(professor)
            .emailType(EmailType.INTERVIEW_ASSIGNED_PROFESSOR)
            .language(Language.fromCode(professor.getSelectedLanguage()))
            .researchGroup(job.getResearchGroup())
            .content(slot)
            .icsContent(icsContent)
            .icsFileName(icsFileName)
            .build();
        asyncEmailSender.sendAsync(professorEmail);
    }

    /**
     * Sends self-scheduling invitations to applicants in the interview process.
     * Can filter to send only to uninvited applicants or re-send to all.
     *
     * @param processId the ID of the interview process
     * @param request   options for sending (e.g. filter uninvited)
     * @return summary of sent emails and failures
     * @throws EntityNotFoundException if process not found
     * @throws AccessDeniedException   if user has no job access
     */

    public SendInvitationsResultDTO sendSelfSchedulingInvitations(UUID processId, SendInvitationsRequestDTO request) {
        // 1. Load interview process
        InterviewProcess process = interviewProcessRepository
            .findById(processId)
            .orElseThrow(() -> EntityNotFoundException.forId("Interview process", processId));

        // 2. Security: Verify current user has job access
        Job job = process.getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Fetch interviewees based on filter
        List<Interviewee> interviewees;
        if (Boolean.TRUE.equals(request.onlyUninvited())) {
            interviewees = intervieweeRepository.findAllByInterviewProcessIdAndLastInvitedIsNull(processId);
        } else {
            interviewees = intervieweeRepository.findByInterviewProcessIdWithDetails(processId);
        }

        // Filter by explicit IDs if provided
        if (request.intervieweeIds() != null && !request.intervieweeIds().isEmpty()) {
            interviewees = interviewees
                .stream()
                .filter(i -> request.intervieweeIds().contains(i.getId()))
                .toList();
        }

        // 4. Send emails
        List<String> failedEmails = new ArrayList<>();
        List<Interviewee> updatedInterviewees = new ArrayList<>();

        for (Interviewee interviewee : interviewees) {
            try {
                // Set job to prevent LazyInitializationException in async email sending
                interviewee.getApplication().setJob(job);
                sendSelfSchedulingEmail(interviewee, job);
                interviewee.setLastInvited(Instant.now());
                updatedInterviewees.add(interviewee);
            } catch (Exception e) {
                log.debug(
                    "Failed to send invitation email to {}: {}",
                    interviewee.getApplication().getApplicant().getUser().getEmail(),
                    e.getMessage()
                );
                failedEmails.add(interviewee.getApplication().getApplicant().getUser().getEmail());
            }
        }

        // 5. Save updated timestamps
        intervieweeRepository.saveAll(updatedInterviewees);

        return new SendInvitationsResultDTO(updatedInterviewees.size(), failedEmails);
    }

    private void sendSelfSchedulingEmail(Interviewee interviewee, Job job) {
        User applicant = interviewee.getApplication().getApplicant().getUser();

        Email email = Email.builder()
            .to(applicant)
            .emailType(EmailType.INTERVIEW_SELF_SCHEDULING_INVITATION)
            .language(Language.fromCode(applicant.getSelectedLanguage()))
            .researchGroup(job.getResearchGroup())
            .content(interviewee) // Pass the interviewee object directly
            .build();

        asyncEmailSender.sendAsync(email);
    }

    /**
     * Maps an {@link Interviewee} entity into its corresponding DTO.
     * Calculates the interview state based on lastInvited and slots.
     *
     * @param interviewee the entity to convert
     * @return the corresponding DTO
     */
    private IntervieweeDTO mapIntervieweeToDTO(Interviewee interviewee) {
        User user = interviewee.getApplication().getApplicant().getUser();
        InterviewSlot scheduledSlot = interviewee.getScheduledSlot();
        IntervieweeState state = calculateIntervieweeState(interviewee);

        return new IntervieweeDTO(
            interviewee.getId(),
            interviewee.getApplication().getApplicationId(),
            mapUserToIntervieweeUserDTO(user),
            interviewee.getLastInvited(),
            scheduledSlot != null ? InterviewSlotDTO.fromEntity(scheduledSlot) : null,
            state
        );
    }

    /**
     * Calculates the interview state based on the interviewee's data.
     *
     * State logic:
     * - UNCONTACTED: lastInvited is null (no invitation sent)
     * - INVITED: lastInvited is set but no slot assigned
     * - SCHEDULED: has a slot assigned
     * - COMPLETED: slot exists and end time is in the past
     *
     * @param interviewee the interviewee to calculate state for
     * @return the calculated state
     */
    public IntervieweeState calculateIntervieweeState(Interviewee interviewee) {
        InterviewSlot slot = interviewee.getScheduledSlot();

        // Has a scheduled slot
        if (slot != null) {
            // Check if interview is completed (end time in the past)
            if (slot.getEndDateTime().isBefore(Instant.now())) {
                return IntervieweeState.COMPLETED;
            }
            return IntervieweeState.SCHEDULED;
        }

        // No slot - check if invited
        if (interviewee.getLastInvited() != null) {
            return IntervieweeState.INVITED;
        }

        return IntervieweeState.UNCONTACTED;
    }

    // Maps a User entity to IntervieweeUserDTO.
    private IntervieweeDTO.IntervieweeUserDTO mapUserToIntervieweeUserDTO(User user) {
        if (user == null) {
            return null;
        }
        return new IntervieweeDTO.IntervieweeUserDTO(user.getUserId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    /**
     * Retrieves full details for a single interviewee including application and
     * documents.
     *
     * @param processId     the ID of the interview process
     * @param intervieweeId the ID of the interviewee
     * @return detailed interviewee information
     * @throws EntityNotFoundException if the interviewee or process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    public IntervieweeDetailDTO getIntervieweeDetails(UUID processId, UUID intervieweeId) {
        // 1. Load interviewee with all relations
        Interviewee interviewee = intervieweeRepository
            .findByIdAndProcessId(intervieweeId, processId)
            .orElseThrow(() -> EntityNotFoundException.forId("Interviewee", intervieweeId));
        // 2. Security: Verify current user has job access
        Job job = interviewee.getInterviewProcess().getJob();
        currentUserService.verifyJobAccess(job);

        // 3. Build and return detail DTO
        return mapIntervieweeToDetailDTO(interviewee, job);
    }

    /**
     * Updates the assessment (rating and/or notes) for an interviewee.
     *
     * @param processId     the ID of the interview process
     * @param intervieweeId the ID of the interviewee
     * @param dto           the update data containing rating and/or notes
     * @return updated interviewee details
     * @throws EntityNotFoundException if the interviewee or process is not found
     * @throws AccessDeniedException   if the user is not authorized
     * @throws BadRequestException     if neither rating nor notes is provided
     */

    public IntervieweeDetailDTO updateAssessment(UUID processId, UUID intervieweeId, UpdateAssessmentDTO dto) {
        // 1. Validate input
        if (!dto.hasContent()) {
            throw new BadRequestException("At least one of rating or notes must be provided");
        }

        // 2. Load interviewee with all relations
        Interviewee interviewee = intervieweeRepository
            .findByIdAndProcessId(intervieweeId, processId)
            .orElseThrow(() -> EntityNotFoundException.forId("Interviewee", intervieweeId));

        // 3. Security: Verify current user has job access
        Job job = interviewee.getInterviewProcess().getJob();
        currentUserService.verifyJobAccess(job);

        // 4. Update fields if provided
        if (Boolean.TRUE.equals(dto.clearRating())) {
            interviewee.setRating(null);
        } else if (dto.rating() != null) {
            interviewee.setRating(AssessmentRating.fromValue(dto.rating()));
        }
        if (dto.notes() != null) {
            interviewee.setAssessmentNotes(dto.notes());
        }

        // 5. Save and return DTO
        intervieweeRepository.save(interviewee);
        return mapIntervieweeToDetailDTO(interviewee, job);
    }

    /**
     * Maps an Interviewee entity to a detailed DTO including application and
     * documents.
     */
    private IntervieweeDetailDTO mapIntervieweeToDetailDTO(Interviewee interviewee, Job job) {
        Application application = interviewee.getApplication();
        User user = application.getApplicant().getUser();
        InterviewSlot slot = interviewee.getScheduledSlot();
        IntervieweeState state = calculateIntervieweeState(interviewee);

        return new IntervieweeDetailDTO(
            interviewee.getId(),
            application.getApplicationId(),
            mapUserToIntervieweeUserDTO(user),
            interviewee.getLastInvited(),
            slot != null ? InterviewSlotDTO.fromEntity(slot) : null,
            state,
            interviewee.getRating() != null ? interviewee.getRating().getValue() : null,
            interviewee.getAssessmentNotes(),
            ApplicationDetailDTO.getFromEntity(application, job),
            documentDictionaryService.getDocumentIdsDTO(application)
        );
    }

    /**
     * Retrieves all interview processes for a given professor.
     *
     * @param user the professor user
     * @return list of interview processes
     */
    public List<InterviewProcess> getInterviewProcessesByProfessor(User user) {
        List<InterviewProcess> processes = interviewProcessRepository.findAllByProfessorId(user.getUserId());
        return processes == null ? List.of() : processes;
    }
}
