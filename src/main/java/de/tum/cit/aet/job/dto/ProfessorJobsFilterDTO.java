package de.tum.cit.aet.job.dto;

import de.tum.cit.aet.job.constants.JobState;

import java.util.List;

/**
 * Filter DTO for retrieving jobs created by a specific professor.
 * Encapsulates optional filters for job title and state.
 *
 * @param titles optional filter for multiple job titles
 * @param state  optional filter for the current job state
 */
public record ProfessorJobsFilterDTO(List<String> titles, JobState state) {
}
