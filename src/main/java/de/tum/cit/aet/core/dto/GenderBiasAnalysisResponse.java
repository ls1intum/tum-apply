package de.tum.cit.aet.core.dto;

import java.util.List;

/**
 * Response DTO for gender bias analysis
 */
public record GenderBiasAnalysisResponse(String originalText, List<BiasedWordDTO> biasedWords, String coding, String language) {}
