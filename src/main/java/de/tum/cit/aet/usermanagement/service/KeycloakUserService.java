package de.tum.cit.aet.usermanagement.service;

import jakarta.ws.rs.core.Response;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class KeycloakUserService {

    private final Keycloak keycloak;
    private final String realm;

    public KeycloakUserService(
        @Value("${KEYCLOAK_URL:http://localhost:9080}") String url,
        @Value("${KEYCLOAK_REALM:tumapply}") String realm,
        @Value("${KEYCLOAK_ADMIN_CLIENT_ID:tumapply-otp-admin}") String clientId,
        @Value("${KEYCLOAK_ADMIN_CLIENT_SECRET:tumapply-otp-secret}") String clientSecret
    ) {
        this.realm = realm;
        this.keycloak = KeycloakBuilder.builder()
            .serverUrl(url)
            .realm(realm)
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .clientId(clientId)
            .clientSecret(clientSecret)
            .build();
    }

    /**
     * Finds a Keycloak user ID by email (case-insensitive).
     *
     * @param email the email address to search for; must not be {@code null}
     * @return an {@link Optional} containing the user ID if a user with the given email exists; otherwise {@link Optional#empty()}
     */
    public Optional<String> findUserIdByEmail(String email) {
        List<UserRepresentation> res = keycloak.realm(realm).users().searchByEmail(email, true);
        if (res == null || res.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(res.get(0).getId());
    }

    /**
     * Ensures a user exists in Keycloak for the given email (creates one if missing).
     * <p>
     * The created user is initialized with {@code enabled=true} and {@code emailVerified=false}. If a concurrent
     * creation happens and Keycloak returns HTTP 409 (conflict), this method performs a follow-up lookup and returns
     * the resulting user ID.
     *
     * @param email the email address used as both username and email in Keycloak; must not be {@code null}
     * @return the Keycloak user ID corresponding to the email
     * @throws IllegalStateException if user creation fails with an unexpected status code
     */
    public String ensureUser(String email) {
        return findUserIdByEmail(email).orElseGet(() -> {
            UserRepresentation u = new UserRepresentation();
            u.setUsername(email);
            u.setEmail(email);
            u.setEnabled(true);
            u.setEmailVerified(false);

            try (Response resp = keycloak.realm(realm).users().create(u)) {
                if (resp.getStatus() == 201 && resp.getLocation() != null) {
                    String path = resp.getLocation().getPath();
                    return path.substring(path.lastIndexOf('/') + 1);
                }
                // If created concurrently we might see 409; try lookup again
                if (resp.getStatus() == 409) {
                    return findUserIdByEmail(email).orElseThrow();
                }
                throw new IllegalStateException("Keycloak user create failed: status=" + resp.getStatus());
            }
        });
    }

    /**
     * Sets the {@code emailVerified} flag to {@code true} for the given user, if not already set.
     *
     * @param userId the Keycloak user ID; must not be {@code null}
     */
    public void markEmailVerified(String userId) {
        var userRes = keycloak.realm(realm).users().get(userId);
        var rep = userRes.toRepresentation();
        if (Boolean.TRUE.equals(rep.isEmailVerified())) {
            return;
        }
        rep.setEmailVerified(true);
        userRes.update(rep);
    }

    /**
     * Invalidates all active sessions of the specified user via backchannel logout.
     *
     * @param userId the Keycloak user ID; must not be {@code null}
     */
    public void logout(String userId) {
        keycloak.realm(realm).users().get(userId).logout();
    }
}
