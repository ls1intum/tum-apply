package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CancelInterviewDTO(@NotNull Boolean sendReinvite, @NotNull Boolean deleteSlot) {}
