package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserNameDTO(
    @NotNull String firstName,
    @NotNull String lastName
) {
}
