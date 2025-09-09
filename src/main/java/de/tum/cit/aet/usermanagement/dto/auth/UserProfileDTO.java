package de.tum.cit.aet.usermanagement.dto.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Minimal, safe profile payload used for OTP-based registration flows.
 * Only includes fields that applicants are allowed to set.
 */
public record UserProfileDTO(
    @NotBlank(message = "First name is required") String firstName,
    @NotBlank(message = "Last name is required") String lastName,
    String password
) {
}
