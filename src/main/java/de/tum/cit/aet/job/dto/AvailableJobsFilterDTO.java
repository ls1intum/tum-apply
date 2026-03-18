package de.tum.cit.aet.job.dto;

import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.SubjectArea;
import java.util.List;

/**
 * Filter DTO for retrieving available job listings.
 * Used to encapsulate optional filter parameters when querying published jobs.
 *
 * @param subjectAreas   filter for multiple subject areas
 * @param locations      filter for multiple job's campus locations
 * @param professorNames filter for multiple supervising professor's
 *                       full names
 *                       (partial match)
 */
public record AvailableJobsFilterDTO(List<SubjectArea> subjectAreas, List<Campus> locations, List<String> professorNames) {}
