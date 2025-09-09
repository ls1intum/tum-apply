package de.tum.cit.aet.usermanagement.dto.auth;

public record AuthResponseDTO(String accessToken, String refreshToken, long expiresIn, long refreshExpiresIn) {
}
