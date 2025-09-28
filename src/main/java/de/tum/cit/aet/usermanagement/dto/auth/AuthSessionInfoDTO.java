package de.tum.cit.aet.usermanagement.dto.auth;

/**
 * Lightweight response: tokens are set as HttpOnly cookies and only lifetimes are returned in the body.
 */
public record AuthSessionInfoDTO(long expiresIn, long refreshExpiresIn, boolean profileRequired) {
    public AuthSessionInfoDTO(long expiresIn, long refreshExpiresIn) {
        this(expiresIn, refreshExpiresIn, false);
    }
}
