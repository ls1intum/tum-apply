package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;


/**
 * DTO for AI-generated job application draft responses.
 */

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AiResponseDTO(String content) {
}
