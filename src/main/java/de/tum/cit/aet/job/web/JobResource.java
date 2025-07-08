package de.tum.cit.aet.job.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.dto.*;
import de.tum.cit.aet.job.service.JobService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
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
     * {@code GET /api/jobs/available} : Returns a paginated list of all available (PUBLISHED) job postings.
     *
     * <p>Supports filtering by title, field of studies, campus location, professor name, and workload.
     * Supports sorting using the {@link SortDTO} for fields such as title, workload, etc.
     * Computed fields like professor name must be handled manually.</p>
     *
     * @param pageDTO the pagination information including page number (zero-based) and page size
     * @param availableJobsFilterDTO DTO containing all optionally filterable fields
     * @param sortDTO sorting parameter containing the field and direction
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} containing a {@link Page} of {@link JobCardDTO}
     */
    @GetMapping("/available")
    public ResponseEntity<Page<JobCardDTO>> getAvailableJobs(
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO,
        @ParameterObject @Valid @ModelAttribute AvailableJobsFilterDTO availableJobsFilterDTO,
        @ParameterObject @Valid @ModelAttribute SortDTO sortDTO
    ) {
        Page<JobCardDTO> jobs = jobService.getAvailableJobs(pageDTO, availableJobsFilterDTO, sortDTO);
        return ResponseEntity.ok(jobs);
    }

    /**
     * {@code POST /api/jobs} : Create a new job posting.
     *
     * @param jobForm the job posting data.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)}.
     */
    @PostMapping("/create")
    public ResponseEntity<JobFormDTO> createJob(@RequestBody JobFormDTO jobForm) {
        JobFormDTO createdJob = jobService.createJob(jobForm);
        return ResponseEntity.ok(createdJob);
    }

    /*
     * {@code PUT /api/jobs/update/{jobId}} : Update an existing job posting.
     *
     * @param jobId the ID of the job to update.
     * @param jobForm the updated job posting data.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the updated job.
     */
    @PutMapping("/update/{jobId}")
    public ResponseEntity<JobFormDTO> updateJob(@PathVariable UUID jobId, @RequestBody JobFormDTO jobForm) {
        JobFormDTO updatedJob = jobService.updateJob(jobId, jobForm);
        return ResponseEntity.ok(updatedJob);
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
     * {@code PUT /api/jobs/changeState/{jobId}} : Change the state of a job posting and optionally reject all associated applications.
     *
     * @param jobId the ID of the job to delete.
     * @param jobState the new state that the job should be updated with.
     * @param shouldRejectRemainingApplications the boolean representing whether all corresponding published applications should be deleted or not, if the new job state is APPLICANT_FOUND
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the updated job.
     */
    @PutMapping("/changeState/{jobId}")
    public ResponseEntity<JobFormDTO> changeJobState(
        @PathVariable UUID jobId,
        @RequestParam JobState jobState,
        @RequestParam(required = false) boolean shouldRejectRemainingApplications
    ) {
        JobFormDTO updatedJob = jobService.changeJobState(jobId, jobState, shouldRejectRemainingApplications);
        return ResponseEntity.ok(updatedJob);
    }

    /**
     * {@code GET /api/jobs/professor/{userId}} : Returns a paginated list of jobs created by a specific professor.
     *
     * <p>Supports optional filtering by title and job state. Sorting is supported using {@link SortDTO}.</p>
     *
     * @param pageDTO pagination parameters including page number and size
     * @param professorJobsFilterDTO DTO containing all optionally filterable fields
     * @param sortDTO sorting parameter
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} containing a {@link Page} of {@link CreatedJobDTO}
     */
    @GetMapping("/professor")
    public ResponseEntity<Page<CreatedJobDTO>> getJobsByProfessor(
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO,
        @ParameterObject @Valid @ModelAttribute ProfessorJobsFilterDTO professorJobsFilterDTO,
        @ParameterObject @Valid @ModelAttribute SortDTO sortDTO
    ) {
        return ResponseEntity.ok(jobService.getJobsByProfessor(pageDTO, professorJobsFilterDTO, sortDTO));
    }

    /**
     * {@code GET /api/jobs/{jobId}} : Get general details of a specific job.
     *
     * @param jobId the ID of the job.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the job details.
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<JobDTO> getJobById(@PathVariable UUID jobId) {
        return ResponseEntity.ok(jobService.getJobById(jobId));
    }

    /**
     * {@code GET /api/jobs/detail/{jobId}} : Get all details of a specific job which are relevant to the Job Detail Page.
     *
     * @param jobId the ID of the job.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the job details.
     */
    @GetMapping("/detail/{jobId}")
    public ResponseEntity<JobDetailDTO> getJobDetails(@PathVariable UUID jobId) {
        return ResponseEntity.ok(jobService.getJobDetails(jobId));
    }
}
