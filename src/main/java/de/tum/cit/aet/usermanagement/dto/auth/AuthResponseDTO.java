package de.tum.cit.aet.usermanagement.dto.auth;

/**
 * Raw authentication response carrying tokens and their lifetimes.
 *
 * @param accessToken      the access token to be used for API requests
 * @param refreshToken     the refresh token for obtaining new access tokens
 * @param expiresIn        lifetime of the access token in seconds
 * @param refreshExpiresIn lifetime of the refresh token in seconds
 */
public record AuthResponseDTO(String accessToken, String refreshToken, long expiresIn, long refreshExpiresIn) {
}
