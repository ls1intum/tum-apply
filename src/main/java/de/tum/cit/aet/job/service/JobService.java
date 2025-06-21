package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.PageUtil;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.*;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public JobService(JobRepository jobRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new job using the provided job form data.
     *
     * @param dto the job details used to create the job
     * @return the created job as a {@link JobFormDTO}
     */
    public JobFormDTO createJob(JobFormDTO dto) {
        Job job = new Job();
        return updateJobEntity(job, dto);
    }

    /**
     * Updates an existing job with the new form data.
     *
     * @param jobId the ID of the job to update
     * @param dto the {@link JobFormDTO} containing updated job details
     * @return the updated job as a {@link JobFormDTO}
     */
    public JobFormDTO updateJob(UUID jobId, JobFormDTO dto) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        return updateJobEntity(job, dto);
    }

    /**
     * Deletes a job posting by ID.
     *
     * @param jobId the ID of the job to delete
     */
    public void deleteJob(UUID jobId) {
        try {
            jobRepository.deleteById(jobId);
        } catch (Exception e) {
            throw EntityNotFoundException.forId("Job", jobId);
        }
    }

    /**
     * Returns a jobDTO given the job id.
     *
     * @param jobId the ID of the job
     * @return the job card DTO with detailed info
     */
    public JobDTO getJobById(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        return new JobDTO(
            job.getJobId(),
            job.getTitle(),
            job.getResearchArea(),
            job.getFieldOfStudies(),
            job.getSupervisingProfessor().getUserId(),
            job.getLocation(),
            job.getStartDate(),
            job.getWorkload(),
            job.getContractDuration(),
            job.getFundingType(),
            job.getDescription(),
            job.getTasks(),
            job.getRequirements(),
            job.getState()
        );
    }

    /**
     * Returns a paginated list of all available (PUBLISHED) jobs.
     * Supports filtering by multiple fields and dynamic sorting, including manual sort for professor name.
     *
     * @param pageDTO pagination configuration
     * @param title optional filter for job title
     * @param fieldOfStudies optional filter for field of studies
     * @param location optional filter for campus location
     * @param professorName optional filter for supervising professor's full name
     * @param workload optional filter for workload value
     * @param sortDTO sort configuration (by field and direction)
     * @return a page of {@link JobCardDTO} matching the criteria
     */
    public Page<JobCardDTO> getAvailableJobs(
        PageDTO pageDTO,
        String title,
        String fieldOfStudies,
        Campus location,
        String professorName,
        Integer workload,
        SortDTO sortDTO
    ) {
        Pageable pageable;
        if (sortDTO.sortBy() != null && sortDTO.sortBy().equals("professorName")) {
            // Use pageable without sort: Sorting will be handled manually in @Query
            pageable = PageUtil.createPageRequest(pageDTO, null, null, false);
            return jobRepository.findAllJobCardsByState(
                JobState.PUBLISHED,
                title,
                fieldOfStudies,
                location,
                professorName,
                workload,
                sortDTO.sortBy(),
                sortDTO.direction().name(),
                pageable
            );
        } else {
            // Sort dynamically via Pageable
            pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.AVAILABLE_JOBS, true);
            return jobRepository.findAllJobCardsByState(
                JobState.PUBLISHED,
                title,
                fieldOfStudies,
                location,
                professorName,
                workload,
                pageable
            );
        }
    }

    /**
     * Returns a paginated list of jobs created by a given professor.
     * Supports optional filtering and dynamic sorting.
     *
     * @param userId the professor's user ID
     * @param pageDTO pagination configuration
     * @param title optional filter for job title
     * @param state optional filter for job state
     * @param sortDTO sorting configuration
     * @return a page of {@link CreatedJobDTO} for the professor's jobs
     */
    public Page<CreatedJobDTO> getJobsByProfessor(UUID userId, PageDTO pageDTO, String title, JobState state, SortDTO sortDTO) {
        Pageable pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.PROFESSOR_JOBS, true);
        return jobRepository.findAllJobsByProfessor(userId, title, state, pageable);
    }

    private JobFormDTO updateJobEntity(Job job, JobFormDTO dto) {
        User supervisingProfessor = userRepository.findByIdElseThrow(dto.supervisingProfessor());
        job.setSupervisingProfessor(supervisingProfessor);
        job.setResearchGroup(supervisingProfessor.getResearchGroup());
        job.setTitle(dto.title());
        job.setResearchArea(dto.researchArea());
        job.setFieldOfStudies(dto.fieldOfStudies());
        job.setLocation(dto.location());
        job.setStartDate(dto.startDate());
        job.setWorkload(dto.workload());
        job.setContractDuration(dto.contractDuration());
        job.setFundingType(dto.fundingType());
        job.setDescription(dto.description());
        job.setTasks(dto.tasks());
        job.setRequirements(dto.requirements());
        job.setState(dto.state());
        Job createdJob = jobRepository.save(job);
        return JobFormDTO.getFromEntity(createdJob);
    }
}
