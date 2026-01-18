package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for AI-generated translation responses.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AIJobDescriptionTranslationDTO(String translatedText) {}
