package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for individual biased word
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BiasedWordDTO(String word, String type) {}
