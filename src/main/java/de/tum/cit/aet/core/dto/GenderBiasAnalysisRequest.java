package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request DTO for gender bias analysis
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GenderBiasAnalysisRequest(
    String text,
    String language // "en" or "de"
) {}
