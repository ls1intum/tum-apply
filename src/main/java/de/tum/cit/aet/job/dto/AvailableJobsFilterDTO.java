package de.tum.cit.aet.job.dto;

import de.tum.cit.aet.job.constants.Campus;
import jakarta.validation.constraints.Min;

/**
 * Filter DTO for retrieving available job listings.
 * Used to encapsulate optional filter parameters when querying published jobs.
 *
 * @param title optional filter for job title (partial match)
 * @param fieldOfStudies optional filter for the field of studies (partial match)
 * @param location optional filter for job's campus location
 * @param professorName optional filter for supervising professor's full name (partial match)
 * @param workload optional filter for workload in hours (must be 0 or positive)
 */
public record AvailableJobsFilterDTO(
    String title,
    String fieldOfStudies,
    Campus location,
    String professorName,
    @Min(0) Integer workload
) {}
