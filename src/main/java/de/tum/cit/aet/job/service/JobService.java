package de.tum.cit.aet.job.service;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.PageUtil;
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
    private final ApplicationRepository applicationRepository;

    public JobService(JobRepository jobRepository, UserRepository userRepository, ApplicationRepository applicationRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
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

    public JobFormDTO changeJobState(UUID jobId, JobState targetState, boolean shouldRejectRemainingApplications) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        job.setState(targetState);
        if (targetState == JobState.CLOSED || shouldRejectRemainingApplications) {
            applicationRepository.rejectPendingApplicationsForJob(jobId);
        }

        return JobFormDTO.getFromEntity(jobRepository.save(job));
        // Code using .stream()
        //     Set<Application> applications = job.getApplications();

        //     job.setState(targetState);

        //     if (targetState == JobState.CLOSED || shouldRejectRemainingApplications) {
        //         applications.stream()
        //             .filter(app -> app.getState() == ApplicationState.SENT ||
        //                           app.getState() == ApplicationState.IN_REVIEW)
        //             .forEach(app -> app.setState(ApplicationState.REJECTED));
        //     }

        //     return JobFormDTO.getFromEntity(jobRepository.save(job));

        // If the new state is APPLICANT_FOUND
        // if (targetState == JobState.APPLICANT_FOUND) {
        // job.setState(JobState.APPLICANT_FOUND);

        // // If the professor wants to reject remaining applications, then reject all
        // applications that are SENT or IN_REVIEW
        // if (shouldRejectRemainingApplications && job.getApplications() != null) {
        // job.getApplications().stream()
        // .filter(app -> app.getState() == ApplicationState.SENT || app.getState() ==
        // ApplicationState.IN_REVIEW)
        // .forEach(app -> app.setState(ApplicationState.REJECTED));
        // }

        // Job savedJob = jobRepository.save(job);
        // return JobFormDTO.getFromEntity(savedJob);
        // }

        // // If the new state is CLOSED
        // if (targetState == JobState.CLOSED) {
        // // Set to CLOSED and reject all applications that have not been reviewed yet
        // job.setState(JobState.CLOSED);
        // if (job.getApplications() != null) {
        // job.getApplications().stream()
        // .filter(app -> app.getState() == ApplicationState.SENT || app.getState() ==
        // ApplicationState.IN_REVIEW)
        // .forEach(app -> app.setState(ApplicationState.REJECTED)); }
        // Job savedJob = jobRepository.save(job);
        // return JobFormDTO.getFromEntity(savedJob);
        // }

        // Default behavior: just change the state
        // job.setState(targetState);
        // Job savedJob = jobRepository.save(job);
        // return JobFormDTO.getFromEntity(savedJob);
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
     * @param availableJobsFilterDTO DTO containing all optionally filterable fields
     * @param sortDTO sort configuration (by field and direction)
     * @return a page of {@link JobCardDTO} matching the criteria
     */
    public Page<JobCardDTO> getAvailableJobs(PageDTO pageDTO, AvailableJobsFilterDTO availableJobsFilterDTO, SortDTO sortDTO) {
        Pageable pageable;
        if (sortDTO.sortBy() != null && sortDTO.sortBy().equals("professorName")) {
            // Use pageable without sort: Sorting will be handled manually in @Query
            pageable = PageUtil.createPageRequest(pageDTO, null, null, false);
            return jobRepository.findAllJobCardsByState(
                JobState.PUBLISHED,
                availableJobsFilterDTO.title(), // optional filter for job title
                availableJobsFilterDTO.fieldOfStudies(), // optional filter for field of studies
                availableJobsFilterDTO.location(), // optional filter for campus location
                availableJobsFilterDTO.professorName(), // optional filter for supervising professor's full name
                availableJobsFilterDTO.workload(), // optional filter for workload value
                sortDTO.sortBy(),
                sortDTO.direction().name(),
                pageable
            );
        } else {
            // Sort dynamically via Pageable
            pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.AVAILABLE_JOBS, true);
            return jobRepository.findAllJobCardsByState(
                JobState.PUBLISHED,
                availableJobsFilterDTO.title(), // optional filter for job title
                availableJobsFilterDTO.fieldOfStudies(), // optional filter for field of studies
                availableJobsFilterDTO.location(), // optional filter for campus location
                availableJobsFilterDTO.professorName(), // optional filter for supervising professor's full name
                availableJobsFilterDTO.workload(), // optional filter for workload value
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
     * @param professorJobsFilterDTO DTO containing all optionally filterable fields
     * @param sortDTO sorting configuration
     * @return a page of {@link CreatedJobDTO} for the professor's jobs
     */
    public Page<CreatedJobDTO> getJobsByProfessor(
        UUID userId,
        PageDTO pageDTO,
        ProfessorJobsFilterDTO professorJobsFilterDTO,
        SortDTO sortDTO
    ) {
        Pageable pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.PROFESSOR_JOBS, true);
        return jobRepository.findAllJobsByProfessor(userId, professorJobsFilterDTO.title(), professorJobsFilterDTO.state(), pageable);
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
