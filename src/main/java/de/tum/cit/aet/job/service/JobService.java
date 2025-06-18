package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.*;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    //private final UserRepository userRepository;

    public JobService(JobRepository jobRepository, UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns a list of open jobs (available for applications).
     *
     * @param filter  optional filter criteria
     * @param sorting optional sorting parameter
     * @return list of available job cards
     */
    public List<JobCardDTO> getAvailableJobs(String filter, String sorting) {
        return null;
        //return jobRepository.findAvailableJobsByState(State.OPEN);
    }

    /**
     * Creates a new job based on the form data.
     *
     * @param dto the job details used to create the job
     */
    public JobFormDTO createJob(JobFormDTO dto) {
        Job job = new Job();
        return updateJobEntity(job, dto);
    }

    /**
     * Updates an existing job with the provided data.
     *
     * @param jobId the ID of the job to update
     * @param dto   the {@link JobFormDTO} containing updated job details
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
     * Returns a paginated list of jobs that are marked as published and available for applicants to apply to.
     *
     * @param pageDTO contains the page number and size for pagination
     * @return a {@link Page} of {@link JobCardDTO} objects representing available jobs as cards
     */
    public Page<JobCardDTO> getAvailableJobs(PageDTO pageDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());
        return jobRepository.findAllJobCardsByState(JobState.PUBLISHED, pageable);
    }

    /**
     * Returns a paginated list of jobs created by a specific professor.
     *
     * @param userId  the UUID of the professor (user)
     * @param pageDTO contains the page number and size for pagination
     * @return a {@link Page} of {@link CreatedJobDTO} objects representing the professor's created jobs
     */
    public Page<CreatedJobDTO> getJobsByProfessor(UUID userId, PageDTO pageDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());
        return jobRepository.findAllJobsByProfessor(userId, pageable);
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
