package de.tum.cit.aet.job.service;

import de.tum.cit.aet.job.constants.State;
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
     */
    public List<JobCardDTO> getAvailableJobs(String filter, String sorting) {
        return jobRepository.findAvailableJobsByState(State.OPEN);
    }

    /**
     * Creates a new job based on the form data.
     */
    public void createJob(JobDetailDTO dto) {
        Job job = new Job();
        updateEntity(job, dto);
        jobRepository.save(job);
    }

    /**
     * Updates an existing job with new values.
     */
    public JobCardDTO updateJob(UUID jobId, JobDetailDTO dto) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found with ID: " + jobId));
        updateEntity(job, dto);
        jobRepository.save(job);
        return toDto(job);
    }

    /**
     * Deletes a job posting by ID.
     */
    public void deleteJob(UUID jobId) {
        jobRepository.deleteById(jobId);
    }

    /**
     * Returns all jobs created by the given professor.
     */
    public List<JobCardDTO> getJobsByProfessor(UUID professorId) {
        return jobRepository.findAllJobsByProfessor(professorId);
    }

    /**
     * Retrieves full details of a job posting.
     */
    public JobCardDTO getJobDetails(UUID jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> new EntityNotFoundException("Job not found with ID: " + jobId));
        return toDto(job);
    }

    // === Mapping Helpers ===

    private void updateEntity(Job job, JobDetailDTO dto) {}

    private JobCardDTO toDto(Job job) {
        // Placeholder for the detailed implementation
        return new JobCardDTO(UUID.randomUUID(), "", "", "", UUID.randomUUID(), 0, Instant.now(), "", State.OPEN, Instant.now());
    }
}
