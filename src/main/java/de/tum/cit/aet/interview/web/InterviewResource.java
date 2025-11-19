package de.tum.cit.aet.interview.web;

import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.security.annotations.ProfessorOrAdmin;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.service.InterviewService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
     * {@code GET /api/interviews/processes/{processId}} : Get details for a specific interview process.
     *
     * @param processId the ID of the interview process
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the {@link InterviewOverviewDTO}
     */
    @Professor
    @GetMapping("/processes/{processId}")
    public ResponseEntity<InterviewOverviewDTO> getInterviewProcessDetails(@PathVariable UUID processId) {
        InterviewOverviewDTO details = interviewService.getInterviewProcessDetails(processId);
        return ResponseEntity.ok(details);
    }
}
