package de.tum.cit.aet.job.dto;

import java.util.List;

/**
 * DTO containing all available filter options for job search dropdowns.
 * Used to provide the client with all possible filter values.
 *
 * @param fieldsOfStudy   all available fields of study
 * @param supervisorNames all available supervisor names
 */
public record JobFiltersDTO(List<String> fieldsOfStudy, List<String> supervisorNames) {}
