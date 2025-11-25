package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for returning enum values with their display names.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record EnumDisplayDTO(String value, String displayName) {}
