package de.tum.cit.aet.job.dto;

import java.util.List;

/**
 * Filter DTO for retrieving available job listings.
 * Used to encapsulate optional filter parameters when querying published jobs.
 *
 * @param titles         filter for multiple job title (partial match)
 * @param fieldOfStudies filter for multiple field of studies (partial
 *                       match)
 * @param locations      filter for multiple job's campus locations
 * @param professorNames filter for multiple supervising professor's
 *                       full names
 *                       (partial match)
 */
public record AvailableJobsFilterDTO(
                List<String> titles,
                List<String> fieldOfStudies,
                List<String> locations,
                List<String> professorNames) {
}
