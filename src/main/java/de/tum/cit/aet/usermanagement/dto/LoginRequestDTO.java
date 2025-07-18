package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
    @Email(message = "Invalid email format") @NotBlank(message = "Email is required") String email,

    @NotBlank(message = "Password is required") String password
) {}
