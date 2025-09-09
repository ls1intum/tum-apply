package de.tum.cit.aet.usermanagement.dto.auth;

import de.tum.cit.aet.usermanagement.dto.UserDTO;

/**
 * Response for OTP-complete flow: always returns the (now authenticated) user and
 * whether the profile still needs completion on the client side.
 */
public record OtpCompleteResponseDTO(
    UserDTO user,
    boolean needsProfileCompletion
) {
}
