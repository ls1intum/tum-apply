package de.tum.cit.aet.job.dto;

import java.util.List;

/**
 * Filter DTO for retrieving jobs created by a specific professor.
 * Encapsulates optional filters for job title and state.
 *
 * @param titles optional filter for multiple job titles
 * @param states optional filter for multiple job states
 */
public record ProfessorJobsFilterDTO(List<String> titles, List<String> states) {
}
