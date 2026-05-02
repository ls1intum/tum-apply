package de.tum.cit.aet.usermanagement.dto.auth;

/**
 * Lightweight response: tokens are set as HttpOnly cookies and only lifetimes are returned in the body.
 */
public record AuthSessionInfoDTO(long expiresIn, long refreshExpiresIn, boolean profileRequired, boolean authenticated) {
    public AuthSessionInfoDTO(long expiresIn, long refreshExpiresIn, boolean profileRequired) {
        this(expiresIn, refreshExpiresIn, profileRequired, true);
    }

    public AuthSessionInfoDTO(long expiresIn, long refreshExpiresIn) {
        this(expiresIn, refreshExpiresIn, false, true);
    }

    public static AuthSessionInfoDTO unauthenticated() {
        return new AuthSessionInfoDTO(0, 0, false, false);
    }
}
