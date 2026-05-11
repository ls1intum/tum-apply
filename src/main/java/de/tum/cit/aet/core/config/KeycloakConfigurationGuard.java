package de.tum.cit.aet.core.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class KeycloakConfigurationGuard {

    private final String keycloakUrl;
    private final String tumLoginRealm;
    private final String externalLoginRealm;
    private final String browserClientId;
    private final String serverExternalClientId;
    private final String serverExternalClientSecret;
    private final String serverTumClientId;
    private final String serverTumClientSecret;
    private final String adminExternalClientId;
    private final String adminExternalClientSecret;
    private final String adminTumClientId;
    private final String adminTumClientSecret;

    public KeycloakConfigurationGuard(
        @Value("${keycloak.url}") String keycloakUrl,
        @Value("${keycloak.tum-login-realm}") String tumLoginRealm,
        @Value("${keycloak.external-login-realm}") String externalLoginRealm,
        @Value("${keycloak.client-id}") String browserClientId,
        @Value("${keycloak.server.external.client-id}") String serverExternalClientId,
        @Value("${keycloak.server.external.client-secret}") String serverExternalClientSecret,
        @Value("${keycloak.server.tum.client-id}") String serverTumClientId,
        @Value("${keycloak.server.tum.client-secret}") String serverTumClientSecret,
        @Value("${keycloak.admin.external.client-id}") String adminExternalClientId,
        @Value("${keycloak.admin.external.client-secret}") String adminExternalClientSecret,
        @Value("${keycloak.admin.tum.client-id}") String adminTumClientId,
        @Value("${keycloak.admin.tum.client-secret}") String adminTumClientSecret
    ) {
        this.keycloakUrl = keycloakUrl;
        this.tumLoginRealm = tumLoginRealm;
        this.externalLoginRealm = externalLoginRealm;
        this.browserClientId = browserClientId;
        this.serverExternalClientId = serverExternalClientId;
        this.serverExternalClientSecret = serverExternalClientSecret;
        this.serverTumClientId = serverTumClientId;
        this.serverTumClientSecret = serverTumClientSecret;
        this.adminExternalClientId = adminExternalClientId;
        this.adminExternalClientSecret = adminExternalClientSecret;
        this.adminTumClientId = adminTumClientId;
        this.adminTumClientSecret = adminTumClientSecret;
        validate();
    }

    private void validate() {
        List<String> missingOrBlank = new ArrayList<>();
        requireNonBlank(missingOrBlank, "keycloak.url", keycloakUrl);
        requireNonBlank(missingOrBlank, "keycloak.tum-login-realm", tumLoginRealm);
        requireNonBlank(missingOrBlank, "keycloak.external-login-realm", externalLoginRealm);
        requireNonBlank(missingOrBlank, "keycloak.client-id", browserClientId);
        requireNonBlank(missingOrBlank, "keycloak.server.external.client-id", serverExternalClientId);
        requireNonBlank(missingOrBlank, "keycloak.server.external.client-secret", serverExternalClientSecret);
        requireNonBlank(missingOrBlank, "keycloak.server.tum.client-id", serverTumClientId);
        requireNonBlank(missingOrBlank, "keycloak.server.tum.client-secret", serverTumClientSecret);
        requireNonBlank(missingOrBlank, "keycloak.admin.external.client-id", adminExternalClientId);
        requireNonBlank(missingOrBlank, "keycloak.admin.external.client-secret", adminExternalClientSecret);
        requireNonBlank(missingOrBlank, "keycloak.admin.tum.client-id", adminTumClientId);
        requireNonBlank(missingOrBlank, "keycloak.admin.tum.client-secret", adminTumClientSecret);
        if (!missingOrBlank.isEmpty()) {
            throw new IllegalStateException(
                "Invalid Keycloak configuration. The following properties must be set and non-blank: " + String.join(", ", missingOrBlank)
            );
        }
    }

    private void requireNonBlank(List<String> missingOrBlank, String key, String value) {
        if (value == null || value.isBlank()) {
            missingOrBlank.add(key);
        }
    }
}
