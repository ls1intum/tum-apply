package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.interview.dto.AddIntervieweesDTO;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.dto.IntervieweeDTO;
import de.tum.cit.aet.interview.service.InterviewService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
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
     * {@code GET /api/interviews/overview} : Get interview overview for all jobs with interview process.
     * Returns statistics about applications in different interview states
     * (completed, scheduled, invited, uncontacted) for each job that has
     * an active interview process.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of {@link InterviewOverviewDTO}
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
     * {@code GET /api/interviews/processes/{processId}} : Get details for a specific interview process.
     *
     * @param processId the ID of the interview process
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the {@link InterviewOverviewDTO}
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
     * @param dto       the slot definitions sent from the frontend
     * @return a {@link ResponseEntity} with status {@code 201 (Created)} containing the created {@link InterviewSlotDTO}s
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
     * {@code GET /api/interviews/processes/{processId}/slots} : Get all slots for an interview process.
     *
     * If year and month are provided, returns only slots for that month.
     * Otherwise, returns all slots for the process.
     *
     * @param processId the ID of the interview process
     * @param year      optional year to filter by (e.g., 2025)
     * @param month     optional month to filter by (1-12)
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and slots
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException if the user is not authorized
     */
    @ProfessorOrEmployee
    @GetMapping("/processes/{processId}/slots")
    public ResponseEntity<PageResponseDTO<InterviewSlotDTO>> getSlotsByProcessId(
        @PathVariable UUID processId,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false) Integer month,
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO
    ) {
        log.info(
            "REST request to get slots for interview process: {}, year: {}, month: {}, pageNumber: {}, pageSize: {}",
            processId,
            year,
            month,
            pageDTO.pageNumber(),
            pageDTO.pageSize()
        );

        PageResponseDTO<InterviewSlotDTO> response;
        if (year != null && month != null) {
            // Return month-filtered slots with pagination
            response = interviewService.getSlotsByProcessIdAndMonth(processId, year, month, pageDTO);
            log.info("Returning {} slots for interview process: {} (month: {}/{})", response.getTotalElements(), processId, month, year);
        } else {
            // Return all slots with pagination
            response = interviewService.getSlotsByProcessId(processId, pageDTO);
            log.info("Returning {} slots for interview process: {}", response.getTotalElements(), processId);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * {@code POST /api/interviews/processes/{processId}/interviewees} : Add applicants to interview process.
     *
     * Creates Interviewee entities for the given application IDs.
     * Duplicates are silently skipped (idempotent operation).
     *
     * @param processId the ID of the interview process
     * @param dto containing the list of application IDs to add
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and list of created {@link IntervieweeDTO}s
     * @throws EntityNotFoundException if the process or any application is not found
     * @throws AccessDeniedException if the user is not authorized
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
     * {@code GET /api/interviews/processes/{processId}/interviewees} : Get all interviewees for an interview process.
     *
     * Retrieves all interviewees for the specified interview process with their details.
     *
     * @param processId the ID of the interview process
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of {@link IntervieweeDTO}
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException if the user is not authorized
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
     * @return the {@link ResponseEntity} with status {@code 204 (No Content)}
     * @throws EntityNotFoundException if the slot is not found
     * @throws AccessDeniedException if the user is not authorized to delete this slot
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
}
