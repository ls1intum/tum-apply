package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Response DTO for gender bias analysis
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record GenderBiasAnalysisResponse(String originalText, List<BiasedWordDTO> biasedWords, String coding, String language) {}
