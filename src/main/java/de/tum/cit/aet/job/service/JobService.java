package de.tum.cit.aet.job.service;

import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.repository.JobRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;

    //private final UserRepository userRepository;

    public JobService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
        //this.userRepository = userRepository;
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
    public void createJob(JobDetailDTO dto) {
        Job job = new Job();
        updateEntity(job, dto);
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
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found with ID: " + jobId));
        updateEntity(job, dto);
        jobRepository.save(job);
        return toDto(job);
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
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found with ID: " + jobId));
        return toDto(job);
    }

    // === Mapping Helpers ===

    private void updateEntity(Job job, JobDetailDTO dto) {
        // TODO: implement field mappings
    }

    private JobCardDTO toDto(Job job) {
        // Placeholder for the detailed implementation
        return new JobCardDTO(UUID.randomUUID(), "", "", "", UUID.randomUUID(), 0, Instant.now(), "", JobState.PUBLISHED, Instant.now());
    }
}
