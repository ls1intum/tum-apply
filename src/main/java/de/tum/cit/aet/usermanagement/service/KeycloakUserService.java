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

    private final Keycloak kc;
    private final String realm;

    public KeycloakUserService(
        @Value("${KEYCLOAK_URL}") String url,
        @Value("${KEYCLOAK_REALM}") String realm,
        @Value("${KEYCLOAK_ADMIN_CLIENT_ID}") String clientId,           // e.g. tumapply-otp-admin
        @Value("${KEYCLOAK_ADMIN_CLIENT_SECRET}") String clientSecret
    ) {
        this.realm = realm;
        this.kc = KeycloakBuilder.builder()
            .serverUrl(url)
            .realm(realm)
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .clientId(clientId)
            .clientSecret(clientSecret)
            .build();
    }

    /**
     * Find Keycloak user-id by email (case insensitive).
     */
    public Optional<String> findUserIdByEmail(String email) {
        List<UserRepresentation> res = kc.realm(realm).users().searchByEmail(email, true);
        if (res == null || res.isEmpty()) return Optional.empty();
        return Optional.of(res.get(0).getId());
    }

    /**
     * Ensure a user exists for the email (enabled=true, emailVerified=false).
     */
    public String ensureUser(String email) {
        return findUserIdByEmail(email).orElseGet(() -> {
            UserRepresentation u = new UserRepresentation();
            u.setUsername(email);
            u.setEmail(email);
            u.setEnabled(true);
            u.setEmailVerified(false);

            Response resp = kc.realm(realm).users().create(u);
            if (resp.getStatus() == 201 && resp.getLocation() != null) {
                String path = resp.getLocation().getPath();
                return path.substring(path.lastIndexOf('/') + 1);
            }
            // If created concurrently we might see 409; try lookup again
            if (resp.getStatus() == 409) {
                return findUserIdByEmail(email).orElseThrow();
            }
            throw new IllegalStateException("Keycloak user create failed: status=" + resp.getStatus());
        });
    }

    /**
     * Set emailVerified=true if not already set.
     */
    public void markEmailVerified(String userId) {
        var userRes = kc.realm(realm).users().get(userId);
        var rep = userRes.toRepresentation();
        if (Boolean.TRUE.equals(rep.isEmailVerified())) return;
        rep.setEmailVerified(true);
        userRes.update(rep);
    }

    /**
     * Invalidate existing sessions so clients must fetch fresh tokens.
     */
    public void logout(String userId) {
        kc.realm(realm).users().get(userId).logout();
    }
}
