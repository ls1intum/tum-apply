package de.tum.cit.aet.job.dto;

import de.tum.cit.aet.job.constants.JobState;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Filter DTO for retrieving jobs created by a specific professor.
 * Encapsulates optional filters for job title and state.
 *
 * @param title optional filter for job title (partial match)
 * @param state optional filter for the current job state
 */
public record ProfessorJobsFilterDTO(String title, JobState state) {}
