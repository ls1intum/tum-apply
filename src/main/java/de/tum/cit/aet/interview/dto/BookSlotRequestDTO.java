package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Request DTO for booking an interview slot.
 * Used by applicants to self-book an available interview slot.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record BookSlotRequestDTO(@NotNull UUID slotId) {}
