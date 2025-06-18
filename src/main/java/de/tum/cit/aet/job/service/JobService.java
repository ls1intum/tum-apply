package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.*;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    // Define sortable fields for getAvailableJobs()
    private static final Set<String> AVAILABLE_JOBS_SORTABLE_FIELDS = Set.of(
        "title",
        "fieldOfStudies",
        "location",
        "professorName",
        "workload",
        "startDate"
    );

    // Define sortable fields for getJobsByProfessor()
    private static final Set<String> PROFESSOR_JOBS_SORTABLE_FIELDS = Set.of("title", "state", "startDate", "createdAt", "lastModifiedAt");

    public JobService(JobRepository jobRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new job based on the form data.
     *
     * @param dto the job details used to create the job
     */
    public void createJob(JobFormDTO dto) {
        Job job = new Job();
        updateJobEntity(job, dto);
    }

    /**
     * Updates an existing job with the provided data.
     *
     * @param jobId the ID of the job to update
     * @param dto   the {@link JobFormDTO} containing updated job details
     */
    public void updateJob(UUID jobId, JobFormDTO dto) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        updateJobEntity(job, dto);
    }

    /**
     * Deletes a job posting by ID.
     *
     * @param jobId the ID of the job to delete
     */
    public void deleteJob(UUID jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new EntityNotFoundException("Job id " + jobId + " does not exist");
        }
        jobRepository.deleteById(jobId);
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
     * Updates the job entity with data from the form DTO.
     *
     * @param job the job entity to update
     * @param dto the form data
     */
    private void updateJobEntity(Job job, JobFormDTO dto) {
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
        jobRepository.save(job);
    }

    /*
    TODO: filter the following as well
    String title,
    String fieldOfStudies,
    String location,
    String professorName,
    Integer workload,
    */
    /**
     * Returns a paginated list of jobs that are marked as published and available for applicants to apply to.
     *
     * @param pageDTO contains the page number and size for pagination
     * @param title  comma-separated list of title filters (partial matches)
     * @param sortDTO sorting parameter
     * @return a {@link Page} of {@link JobCardDTO} objects representing available jobs as cards
     */
    public Page<JobCardDTO> getAvailableJobs(PageDTO pageDTO, String title, SortDTO sortDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize(), sortDTO.toSpringSort(AVAILABLE_JOBS_SORTABLE_FIELDS));
        return jobRepository.findAllJobCardsByState(JobState.PUBLISHED, title, pageable);
    }

    /**
     * Returns a paginated list of jobs created by a specific professor.
     *
     * @param userId  the UUID of the professor (user)
     * @param pageDTO contains the page number and size for pagination
     * @param title  comma-separated list of title filters (partial matches)
     * @param state   job state filter
     * @param sortDTO sorting parameter
     * @return a {@link Page} of {@link CreatedJobDTO} objects representing the professor's created jobs
     */
    public Page<CreatedJobDTO> getJobsByProfessor(UUID userId, PageDTO pageDTO, String title, JobState state, SortDTO sortDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize(), sortDTO.toSpringSort(PROFESSOR_JOBS_SORTABLE_FIELDS));
        return jobRepository.findAllJobsByProfessor(userId, title, state, pageable);
    }
}
