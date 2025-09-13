package de.tum.cit.aet.usermanagement.dto.auth;

/**
 * Minimal, safe profile payload used for OTP-based registration flows.
 * Only includes fields that applicants are allowed to set.
 */
public record UserProfileDTO(
    String firstName,
    String lastName
) {
}
