package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.SubjectArea;
import java.util.List;

/**
 * DTO containing all available filter options for job search dropdowns.
 * Used to provide the client with all possible filter values.
 *
 * @param subjectAreas   all available subject areas
 * @param supervisorNames all available supervisor names
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobFiltersDTO(List<SubjectArea> subjectAreas, List<String> supervisorNames) {}
