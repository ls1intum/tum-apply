package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.security.annotations.ProfessorOrAdmin;
import de.tum.cit.aet.interview.dto.CreateInterviewProcessDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewProcessDTO;
import de.tum.cit.aet.interview.service.InterviewService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
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
    @ProfessorOrAdmin
    @GetMapping("/overview")
    public ResponseEntity<List<InterviewOverviewDTO>> getInterviewOverview() {
        List<InterviewOverviewDTO> overview = interviewService.getInterviewOverview();
        return ResponseEntity.ok(overview);
    }

    @ProfessorOrAdmin
    @PostMapping
    public ResponseEntity<InterviewProcessDTO> createInterviewProcess(@Valid @RequestBody CreateInterviewProcessDTO dto) {
        InterviewProcessDTO interviewProcess = interviewService.createInterviewProcess(dto);
        URI location = URI.create("/api/interviews/" + interviewProcess.id());
        return ResponseEntity.created(location).body(interviewProcess);
    }
}
