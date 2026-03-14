package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for updating the location of an interview slot.
 *
 * @param location the new location string (e.g. room number or video link)
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record UpdateSlotLocationDTO(@NotBlank String location) {}
