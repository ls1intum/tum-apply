package de.tum.cit.aet.usermanagement.dto.auth;

import de.tum.cit.aet.usermanagement.constants.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Single-call OTP completion request. Validates the OTP and performs the requested purpose.
 */
public record OtpCompleteDTO(
    @NotNull OtpPurpose purpose,
    @NotBlank @Email String email,
    @NotBlank String code,
    UserProfileDTO profile
) {
}
