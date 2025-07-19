package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.job.domain.Job;
import java.util.UUID;

public record JobFilterOptionDTO(String jobName, UUID jobId) {
    public static JobFilterOptionDTO fromJob(Job job) {
        if (job == null) {
            return null;
        }
        return new JobFilterOptionDTO(job.getTitle(), job.getJobId());
    }
}
