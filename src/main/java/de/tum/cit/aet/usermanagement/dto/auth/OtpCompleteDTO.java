package de.tum.cit.aet.usermanagement.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Single-call OTP completion request. Validates the OTP and performs the requested purpose.
 */
public record OtpCompleteDTO(
    @NotBlank @Email String email,
    @NotBlank String code,
    UserProfileDTO profile
) {
}
