package de.tum.cit.aet.usermanagement.dto.auth;

/**
 * Raw authentication response carrying tokens and their lifetimes.
 */
public record AuthResponseDTO(String accessToken, String refreshToken, long expiresIn, long refreshExpiresIn) {
}
