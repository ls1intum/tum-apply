package de.tum.cit.aet.job.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.job.dto.*;
import de.tum.cit.aet.job.service.JobService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
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

    private static final Logger log = LoggerFactory.getLogger(JobResource.class);
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
    /* TO-DO
        @GetMapping("/available")
    public ResponseEntity<List<JobCardDTO>> getAvailableJobs(
        @RequestParam(required = false) String filter,
        @RequestParam(required = false) String sorting
    ) {
        return ResponseEntity.ok(jobService.getAvailableJobs(filter, sorting));
    }*/

    /**
     * {@code GET /api/jobs/available} : Returns a paginated list of all available (published) job postings.
     *
     * <p>This endpoint returns job postings that are currently in the {@code PUBLISHED} state and
     * that applicants are able to submit an application for. Results are paginated based on the parameters provided in {@link PageDTO}.</p>
     *
     * @param pageDTO the pagination information including page number (zero-based) and page size
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} containing a {@link Page} of {@link JobCardDTO}
     */
    @GetMapping("/available")
    public ResponseEntity<Page<JobCardDTO>> getAvailableJobs(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        Page<JobCardDTO> jobs = jobService.getAvailableJobs(pageDTO);
        return ResponseEntity.ok(jobs);
    }

    /**
     * {@code POST /api/jobs} : Create a new job posting.
     *
     * @param jobForm the job posting data.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)}.
     */
    @PostMapping("/create")
    public ResponseEntity<Void> createJob(@RequestBody JobFormDTO jobForm) {
        log.debug("REST request to create Job : {}", jobForm);
        jobService.createJob(jobForm);
        log.debug("REST request to create Job : {} succeeded", jobForm);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /*
     * {@code PUT /api/jobs/update/{jobId}} : Update an existing job posting.
     *
     * @param jobId   the ID of the job to update.
     * @param jobForm the updated job posting data.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the updated job.
     */
    @PutMapping("/update/{jobId}")
    public ResponseEntity<Void> updateJob(@PathVariable UUID jobId, @RequestBody JobFormDTO jobForm) {
        jobService.updateJob(jobId, jobForm);
        return ResponseEntity.status(HttpStatus.CREATED).build();
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
     * {@code GET /api/jobs/professor/{userId}} : Returns a paginated list of jobs created by a specific professor.
     *
     * <p>This endpoint allows fetching all job postings associated with a given professor,
     * identified by their user ID. Results are paginated using the {@link PageDTO} parameters.</p>
     *
     * @param userId   the unique ID of the professor (user) whose job postings are being queried
     * @param pageDTO  the pagination information including page number and page size
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} containing a {@link Page} of {@link CreatedJobDTO}
     */
    @GetMapping("/professor/{userId}")
    public ResponseEntity<Page<CreatedJobDTO>> getJobsByProfessor(
        @PathVariable UUID userId,
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO
    ) {
        return ResponseEntity.ok(jobService.getJobsByProfessor(userId, pageDTO));
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
