package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
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
    @Transactional
    public void createJob(JobFormDTO dto) {
        Job job = new Job();
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

    /**
     * Updates an existing job with new values.
     *
     * @param jobId the ID of the job to update
     * @param dto   the updated job details
     * @return the updated job card DTO
     */
    public JobCardDTO updateJob(UUID jobId, JobDetailDTO dto) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        //updateEntity(job, dto);
        jobRepository.save(job);
        //return toDto(job);
        return null;
    }

    /**
     * Deletes a job posting by ID.
     *
     * @param jobId the ID of the job to delete
     */
    public void deleteJob(UUID jobId) {
        jobRepository.deleteById(jobId);
    }

    /**
     * Returns all jobs created by the given professor.
     *
     * @param professorId the ID of the professor
     * @return list of job cards created by the professor
     */
    public List<JobCardDTO> getJobsByProfessor(UUID professorId) {
        return null;
        //return jobRepository.findAllJobsByProfessor(professorId);
    }

    /**
     * Retrieves full details of a job posting.
     *
     * @param jobId the ID of the job
     * @return the job card DTO with detailed info
     */
    public JobCardDTO getJobDetails(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> EntityNotFoundException.forId("Job", jobId));
        //return toDto(job);
        return null;
    }

    private void updateEntity(Job job, JobFormDTO dto) {
        // TODO: implement field mappings
    }

    /**
     * Fetches all jobs with state PUBLISHED as job cards.
     *
     * @return list of JobCardDTOs
     */
    public List<JobCardDTO> getAvailableJobs() {
        return jobRepository.findAllJobCardsByState(JobState.PUBLISHED);
    }

}
