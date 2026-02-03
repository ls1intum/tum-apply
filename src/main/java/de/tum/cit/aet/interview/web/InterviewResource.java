package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.BadRequestException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.interview.dto.AddIntervieweesDTO;
import de.tum.cit.aet.interview.dto.AssignSlotRequestDTO;
import de.tum.cit.aet.interview.dto.ConflictDataDTO;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.dto.IntervieweeDTO;
import de.tum.cit.aet.interview.dto.IntervieweeDetailDTO;
import de.tum.cit.aet.interview.dto.SendInvitationsRequestDTO;
import de.tum.cit.aet.interview.dto.SendInvitationsResultDTO;
import de.tum.cit.aet.interview.dto.UpcomingInterviewDTO;
import de.tum.cit.aet.interview.dto.UpdateAssessmentDTO;
import de.tum.cit.aet.interview.service.InterviewService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing interview processes.
 * Provides endpoints for interview overview and management.
 */
@Slf4j
@RestController
@RequestMapping("/api/interviews")
public class InterviewResource {

    private final InterviewService interviewService;

    public InterviewResource(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    /**
     * {@code GET /api/interviews/overview} : Get interview overview for all jobs
     * with interview process.
     * <p>
     * Returns statistics about applications in different interview states
     * (completed, scheduled, invited, uncontacted) for each job that has
     * an active interview process.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of
     *         {@link InterviewOverviewDTO}
     */
    @ProfessorOrEmployee
    @GetMapping("/overview")
    public ResponseEntity<List<InterviewOverviewDTO>> getInterviewOverview() {
        log.info("REST request to get all interview processes{}");
        List<InterviewOverviewDTO> overview = interviewService.getInterviewOverview();
        log.info("Returning all interview processes");
        return ResponseEntity.ok(overview);
    }

    /**
     * {@code GET /api/interviews/upcoming} : Get upcoming interviews for the
     * dashboard.
     * <p>
     * Returns a list of strictly upcoming booked interviews for the logged-in
     * professor.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of
     *         {@link UpcomingInterviewDTO}
     */
    @ProfessorOrEmployee
    @GetMapping("/upcoming")
    public ResponseEntity<List<UpcomingInterviewDTO>> getUpcomingInterviews() {
        log.info("REST request to get upcoming interviews");
        List<UpcomingInterviewDTO> upcomingCalls = interviewService.getUpcomingInterviews();
        log.info("Returning {} upcoming interviews", upcomingCalls.size());
        return ResponseEntity.ok(upcomingCalls);
    }

    /**
     * {@code GET /api/interviews/processes/{processId}} : Get details for a
     * specific interview process.
     *
     * @param processId the ID of the interview process
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the
     *         {@link InterviewOverviewDTO}
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}")
    public ResponseEntity<InterviewOverviewDTO> getInterviewProcessDetails(@PathVariable UUID processId) {
        log.info("REST request to get interview process id {}", processId);
        InterviewOverviewDTO details = interviewService.getInterviewProcessDetails(processId);
        log.info("Returning {} interview processes", processId);
        return ResponseEntity.ok(details);
    }

    /**
     * {@code POST /api/interviews/processes/{processId}/slots/create} :
     * Creates one or more interview slots for a given interview process.
     * <p>
     * Accessible only to users with the {@code PROFESSOR} role.
     *
     * @param processId the ID of the interview process to which the slots belong
     * @param dto       the slot definitions sent from client
     * @return a {@link ResponseEntity} with status {@code 201 (Created)} containing
     *         the created {@link InterviewSlotDTO}s
     */
    @ProfessorOrEmployee
    @PostMapping("/processes/{processId}/slots/create")
    public ResponseEntity<List<InterviewSlotDTO>> createSlots(@PathVariable UUID processId, @Valid @RequestBody CreateSlotsDTO dto) {
        log.info("REST request to create {} slots for interview process: {}", dto.slots().size(), processId);
        List<InterviewSlotDTO> slots = interviewService.createSlots(processId, dto);
        log.info("Successfully created {} slots for interview process: {}", slots.size(), processId);
        return ResponseEntity.status(HttpStatus.CREATED).body(slots);
    }

    /**
     * {@code GET /api/interviews/processes/{processId}/slots} : Get all slots for
     * an interview process.
     *
     * Retrieves all interview slots for the specified interview process,
     * ordered by start time (ascending). Supports optional filtering by year and
     * month.
     *
     * @param processId the ID of the interview process
     * @param year      optional year filter
     * @param month     optional month filter
     * @param page      zero-based page index (default: 0)
     * @param size      the size of the page (default: 20)
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and page of
     *         {@link InterviewSlotDTO}
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}/slots")
    public ResponseEntity<PageResponseDTO<InterviewSlotDTO>> getSlotsByProcessId(
        @PathVariable UUID processId,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        log.info("REST request to get slots for process: {}, year: {}, month: {}, page: {}", processId, year, month, page);
        PageDTO pageDTO = new PageDTO(size, page);
        PageResponseDTO<InterviewSlotDTO> slots = interviewService.getSlotsByProcessId(processId, year, month, pageDTO);
        log.info("Returning {} slots for interview process: {}", slots.getTotalElements(), processId);
        return ResponseEntity.ok(slots);
    }

    /**
     * {@code GET /api/interviews/processes/{processId}/slots/conflict-data} : Get
     * conflict data for slot creation.
     *
     * Returns all slots relevant for conflict detection on a specific date:
     * - All slots from the current process (for SAME_PROCESS conflict detection)
     * - All booked slots from other processes (for BOOKED_OTHER_PROCESS conflict
     * detection)
     *
     * @param processId the ID of the interview process
     * @param date      the date to check for conflicts (ISO format: YYYY-MM-DD)
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and
     *         {@link ConflictDataDTO}
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}/slots/conflict-data")
    public ResponseEntity<ConflictDataDTO> getConflictDataForDate(
        @PathVariable UUID processId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        log.info("REST request to get conflict data for process: {} on date: {}", processId, date);
        ConflictDataDTO conflictData = interviewService.getConflictDataForDate(processId, date);
        log.info("Returning {} slots for conflict checking", conflictData.slots().size());
        return ResponseEntity.ok(conflictData);
    }

    /**
     * {@code GET /api/interviews/processes/{processId}/slots/available-count} :
     * Count
     * available future slots.
     *
     * @param processId the ID of the interview process
     * @return the count of available future slots
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}/slots/available-count")
    public ResponseEntity<Long> countAvailableFutureSlots(@PathVariable UUID processId) {
        log.info("REST request to count future available slots for process: {}", processId);
        long count = interviewService.countFutureAvailableSlots(processId);
        return ResponseEntity.ok(count);
    }

    /**
     * {@code POST /api/interviews/processes/{processId}/interviewees} : Add
     * applicants to interview process.
     *
     * Creates Interviewee entities for the given application IDs.
     * Duplicates are silently skipped (idempotent operation).
     *
     * @param processId the ID of the interview process
     * @param dto       containing the list of application IDs to add
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and list
     *         of created {@link IntervieweeDTO}s
     * @throws EntityNotFoundException if the process or any application is not
     *                                 found
     * @throws AccessDeniedException   if the user is not authorized
     */
    @ProfessorOrEmployee
    @PostMapping("/processes/{processId}/interviewees")
    public ResponseEntity<List<IntervieweeDTO>> addApplicantsToInterview(
        @PathVariable UUID processId,
        @Valid @RequestBody AddIntervieweesDTO dto
    ) {
        log.info("REST request to add {} applicants to interview process: {}", dto.applicationIds().size(), processId);

        List<IntervieweeDTO> result = interviewService.addApplicantsToInterview(processId, dto);

        log.info("Successfully added {} interviewees to interview process: {}", result.size(), processId);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * {@code GET /api/interviews/processes/{processId}/interviewees} : Get all
     * interviewees for an interview process.
     *
     * Retrieves all interviewees for the specified interview process with their
     * details.
     *
     * @param processId the ID of the interview process
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of
     *         {@link IntervieweeDTO}
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}/interviewees")
    public ResponseEntity<List<IntervieweeDTO>> getIntervieweesByProcessId(@PathVariable UUID processId) {
        log.info("REST request to get all interviewees for interview process: {}", processId);

        List<IntervieweeDTO> interviewees = interviewService.getIntervieweesByProcessId(processId);

        log.info("Returning {} interviewees for interview process: {}", interviewees.size(), processId);

        return ResponseEntity.ok(interviewees);
    }

    /*
     * {@code DELETE /api/interviews/slots/{slotId}} : Delete a single interview
     * slot.
     * Deletes an unbooked interview slot. If the slot is booked, a
     * BadRequestException is thrown.
     *
     * @param slotId the ID of the slot to delete
     *
     * @return the {@link ResponseEntity} with status {@code 204 (No Content)}
     *
     * @throws EntityNotFoundException if the slot is not found
     *
     * @throws AccessDeniedException if the user is not authorized to delete this
     * slot
     *
     * @throws BadRequestException if the slot is booked
     */
    @ProfessorOrEmployee
    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<Void> deleteSlot(@PathVariable UUID slotId) {
        log.info("REST request to delete slot: {}", slotId);
        interviewService.deleteSlot(slotId);
        log.info("Successfully deleted slot: {}", slotId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET
     * /api/interviews/processes/{processId}/interviewees/{intervieweeId}} :
     * Get detailed information for a single interviewee.
     *
     * @param processId     the ID of the interview process
     * @param intervieweeId the ID of the interviewee
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the
     *         {@link IntervieweeDetailDTO}
     *
     * @throws EntityNotFoundException if the interviewee or process is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}/interviewees/{intervieweeId}")
    public ResponseEntity<IntervieweeDetailDTO> getIntervieweeDetails(@PathVariable UUID processId, @PathVariable UUID intervieweeId) {
        log.info("REST request to get interviewee details: {} in process: {}", intervieweeId, processId);
        IntervieweeDetailDTO details = interviewService.getIntervieweeDetails(processId, intervieweeId);
        log.info("Returning details for interviewee: {}", intervieweeId);
        return ResponseEntity.ok(details);
    }

    /**
     * {@code PUT
     * /api/interviews/processes/{processId}/interviewees/{intervieweeId}/assessment}
     * Update the assessment (rating and/or notes) for an interviewee.
     *
     * @param processId     the ID of the interview process
     * @param intervieweeId the ID of the interviewee
     * @param dto           the update data containing rating and/or notes
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the
     *         updated {@link IntervieweeDetailDTO}
     *
     * @throws EntityNotFoundException if the interviewee or process is not found
     * @throws AccessDeniedException   if the user is not authorized
     * @throws BadRequestException     if neither rating nor notes is provided
     */
    @ProfessorOrEmployee
    @PutMapping("/processes/{processId}/interviewees/{intervieweeId}/assessment")
    public ResponseEntity<IntervieweeDetailDTO> updateAssessment(
        @PathVariable UUID processId,
        @PathVariable UUID intervieweeId,
        @Valid @RequestBody UpdateAssessmentDTO dto
    ) {
        log.info("REST request to update assessment for interviewee: {} in process: {}", intervieweeId, processId);
        IntervieweeDetailDTO updated = interviewService.updateAssessment(processId, intervieweeId, dto);
        log.info("Successfully updated assessment for interviewee: {}", intervieweeId);
        return ResponseEntity.ok(updated);
    }

    /**
     * {@code POST /api/interviews/slots/{slotId}/assign} : Assign an interviewee to
     * a slot.
     *
     * Assigns the applicant to the specified slot.
     * The applicant must have been previously added to the interview process.
     *
     * @param slotId the ID of the slot to assign
     * @param dto    containing the application ID
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the
     *         updated {@link InterviewSlotDTO}
     * @throws EntityNotFoundException if the slot or interviewee is not found
     * @throws AccessDeniedException   if the user is not authorized
     */
    @ProfessorOrEmployee
    @PostMapping("/slots/{slotId}/assign")
    public ResponseEntity<InterviewSlotDTO> assignSlotToInterviewee(
        @PathVariable UUID slotId,
        @Valid @RequestBody AssignSlotRequestDTO dto
    ) {
        log.info("REST request to assign slot {} to application {}", slotId, dto.applicationId());
        InterviewSlotDTO result = interviewService.assignSlotToInterviewee(slotId, dto.applicationId());
        log.info("Successfully assigned slot {} to interviewee", slotId);
        return ResponseEntity.ok(result);
    }

    /**
     * {@code POST /api/interviews/processes/{processId}/send-invitations} : Send
     * self-scheduling invitations.
     *
     * Triggers email sending for applicants in the interview process.
     * Can filter to send only to those not yet invited.
     *
     * @param processId the ID of the interview process
     * @param dto       options for sending invitations
     * @return summary of sent emails and failures
     * @throws EntityNotFoundException if the process is not found
     * @throws AccessDeniedException   if user has no job access
     */
    @ProfessorOrEmployee
    @PostMapping("/processes/{processId}/send-invitations")
    public ResponseEntity<SendInvitationsResultDTO> sendInvitations(
        @PathVariable UUID processId,
        @RequestBody SendInvitationsRequestDTO dto
    ) {
        log.info("REST request to send invitations for process: {}", processId);
        SendInvitationsResultDTO result = interviewService.sendSelfSchedulingInvitations(processId, dto);
        log.info("Sent {} invitations for process: {}", result.sentCount(), processId);
        return ResponseEntity.ok(result);
    }
}
