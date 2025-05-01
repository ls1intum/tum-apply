package de.tum.cit.aet.job.web;

import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.service.JobService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing job postings.
 * Provides endpoints for creating, updating, deleting, and retrieving jobs.
 */
@RestController
@RequestMapping("/api/jobs")
public class JobResource {

    private final JobService jobService;

    public JobResource(JobService jobService) {
        this.jobService = jobService;
    }

    /**
     * {@code GET /api/jobs/available} : Get all available (open) jobs.
     *
     * @param filter  Optional filter string for job search.
     * @param sorting Optional sorting parameter for job results.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of available jobs.
     */
    @GetMapping("/available")
    public ResponseEntity<List<JobCardDTO>> getAvailableJobs(
        @RequestParam(required = false) String filter,
        @RequestParam(required = false) String sorting
    ) {
        return ResponseEntity.ok(jobService.getAvailableJobs(filter, sorting));
    }

    /**
     * {@code POST /api/jobs} : Create a new job posting.
     *
     * @param jobForm the job posting data.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)}.
     */
    @PostMapping("/creates-job")
    public ResponseEntity<Void> createJob(@RequestBody JobDetailDTO jobForm) {
        //jobService.createJob(jobForm);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * {@code PUT /api/jobs/jobform/{jobId}} : Update an existing job posting.
     *
     * @param jobId   the ID of the job to update.
     * @param jobForm the updated job posting data.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the updated job.
     */
    @PutMapping("/jobform/{jobId}")
    public ResponseEntity<JobCardDTO> updateJob(@PathVariable UUID jobId, @RequestBody JobDetailDTO jobForm) {
        return ResponseEntity.ok(jobService.updateJob(jobId, jobForm));
    }

    /**
     * {@code DELETE /api/jobs/{jobId}} : Delete a job posting.
     *
     * @param jobId the ID of the job to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (No Content)}.
     */
    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> deleteJob(@PathVariable UUID jobId) {
        jobService.deleteJob(jobId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/jobs/professor/{userId}} : Get all jobs posted by a specific professor.
     *
     * @param userId the ID of the professor (user).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of jobs.
     */
    @GetMapping("/professor/{userId}")
    public ResponseEntity<List<JobCardDTO>> getJobsByProfessor(@PathVariable UUID userId) {
        return ResponseEntity.ok(jobService.getJobsByProfessor(userId));
    }

    /**
     * {@code GET /api/jobs/{jobId}/details} : Get full details of a specific job.
     *
     * @param jobId the ID of the job.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the job details.
     */
    @GetMapping("/{jobId}/details")
    public ResponseEntity<JobCardDTO> getJobDetails(@PathVariable UUID jobId) {
        return ResponseEntity.ok(jobService.getJobDetails(jobId));
    }
}
