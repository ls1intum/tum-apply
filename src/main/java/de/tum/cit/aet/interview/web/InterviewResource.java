package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.security.annotations.ProfessorOrAdmin;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.service.InterviewService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing interview processes.
 * Provides endpoints for interview overview and management.
 */
@RestController
@RequestMapping("/api/interviews")
public class InterviewResource {

    private final InterviewService interviewService;

    public InterviewResource(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    /**
     * {@code GET /api/interviews/overview} : Get interview overview for all jobs with interview process.
     *
     * Returns statistics about applications in different interview states
     * (completed, scheduled, invited, uncontacted) for each job that has
     * an active interview process.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of {@link InterviewOverviewDTO}
     */
    @Professor
    @GetMapping("/overview")
    public ResponseEntity<List<InterviewOverviewDTO>> getInterviewOverview() {
        List<InterviewOverviewDTO> overview = interviewService.getInterviewOverview();
        return ResponseEntity.ok(overview);
    }

    /**
     * {@code POST /api/interviews/processes/{processId}/slots/create} :
     * Creates one or more interview slots for a given interview process.
     *
     * Accessible only to users with the {@code PROFESSOR}
     *
     * @param processId the ID of the interview process to which the slots belong
     * @param dto       the slot definitions sent from the frontend
     * @return a {@link ResponseEntity} with status {@code 201 (Created)} containing the created {@link InterviewSlotDTO}s
     */
    @PostMapping("/processes/{processId}/slots/create")
    @Professor
    public ResponseEntity<List<InterviewSlotDTO>> createSlots(@PathVariable UUID processId, @Valid @RequestBody CreateSlotsDTO dto) {
        List<InterviewSlotDTO> slots = interviewService.createSlots(processId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(slots);
    }

    /**
     * {@code GET /api/interviews/processes/{processId}/slots} : Get all slots for an interview process.
     *
     * Retrieves all interview slots for the specified interview process,
     * ordered by start time (ascending).
     *
     * @param processId the ID of the interview process
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and list of {@link InterviewSlotDTO}
     * @throws EntityNotFoundException if the interview process is not found
     * @throws AccessDeniedException if the user is not authorized
     */
    @Professor
    @GetMapping("/processes/{processId}/slots")
    public ResponseEntity<List<InterviewSlotDTO>> getSlotsByProcessId(@PathVariable UUID processId) {
        List<InterviewSlotDTO> slots = interviewService.getSlotsByProcessId(processId);
        return ResponseEntity.ok(slots);
    }
}
