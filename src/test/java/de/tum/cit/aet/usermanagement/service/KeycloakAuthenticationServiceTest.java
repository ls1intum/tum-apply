package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.service.JwtService;
import de.tum.cit.aet.usermanagement.dto.auth.PasskeyActionTokenDTO;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.keycloak.authorization.client.AuthzClient;
import org.keycloak.authorization.client.Configuration;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class KeycloakAuthenticationServiceTest {

    private static final String KEYCLOAK_URL = "http://localhost:9080";
    private static final String EXTERNAL_REALM = "external-login";
    private static final String TUM_REALM = "tum";
    private static final String BROWSER_CLIENT_ID = "tumapply-client";
    private static final String SERVER_CLIENT_ID = "tumapply-server-client";

    @Mock
    private JwtService jwtService;

    @Mock
    private KeycloakUserService keycloakUserService;

    @Mock
    private AuthzClient authzClient;

    private KeycloakAuthenticationService service;

    @BeforeEach
    void setUp() {
        try (MockedStatic<AuthzClient> mockedAuthzClient = mockStatic(AuthzClient.class)) {
            mockedAuthzClient.when(() -> AuthzClient.create(any(Configuration.class))).thenReturn(authzClient);
            service = new KeycloakAuthenticationService(
                KEYCLOAK_URL,
                EXTERNAL_REALM,
                TUM_REALM,
                BROWSER_CLIENT_ID,
                SERVER_CLIENT_ID,
                "server-secret",
                "admin-client",
                "admin-secret",
                jwtService,
                keycloakUserService
            );
        }
    }

    @Test
    void createPasskeyActionTokenUsesIssuingRealmAndAuthorizedParty() {
        Jwt jwt = jwt("access-token", "user-id", TUM_REALM);
        when(jwtService.getAuthorizedParty(jwt)).thenReturn(SERVER_CLIENT_ID);
        when(jwtService.secondsUntilExpiry(jwt)).thenReturn(120);

        PasskeyActionTokenDTO result = service.createPasskeyActionToken(jwt);

        assertThat(result.realm()).isEqualTo(TUM_REALM);
        assertThat(result.clientId()).isEqualTo(SERVER_CLIENT_ID);
        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.expiresIn()).isEqualTo(120);
    }

    @Test
    void createPasskeyActionTokenFallsBackToBrowserClientForExternalRealm() {
        Jwt jwt = jwt("external-token", "external-user", EXTERNAL_REALM);
        when(jwtService.getAuthorizedParty(jwt)).thenReturn(null);
        when(jwtService.secondsUntilExpiry(jwt)).thenReturn(60);

        PasskeyActionTokenDTO result = service.createPasskeyActionToken(jwt);

        assertThat(result.realm()).isEqualTo(EXTERNAL_REALM);
        assertThat(result.clientId()).isEqualTo(BROWSER_CLIENT_ID);
        assertThat(result.accessToken()).isEqualTo("external-token");
        assertThat(result.expiresIn()).isEqualTo(60);
    }

    @Test
    void listPasskeysReturnsOnlyWebAuthnCredentials() {
        Jwt jwt = jwt("access-token", "user-id", EXTERNAL_REALM);
        CredentialRepresentation passwordless = credential("passkey-1", "webauthn-passwordless");
        CredentialRepresentation webauthn = credential("passkey-2", "WEBAUTHN");
        CredentialRepresentation password = credential("password-1", CredentialRepresentation.PASSWORD);
        when(keycloakUserService.getCredentials("user-id", jwt.getIssuer())).thenReturn(List.of(passwordless, webauthn, password));

        Object result = service.listPasskeys(jwt);

        assertThat(result).isInstanceOf(Map.class);
        assertThat((List<?>) ((Map<?, ?>) result).get("credentials"))
            .extracting(credential -> ((CredentialRepresentation) credential).getId())
            .containsExactly("passkey-1", "passkey-2");
        verify(keycloakUserService).getCredentials("user-id", jwt.getIssuer());
    }

    @Test
    void removePasskeyDelegatesToKeycloakUserServiceWithTokenIssuer() {
        Jwt jwt = jwt("access-token", "user-id", EXTERNAL_REALM);

        service.removePasskey(jwt, "credential-id");

        verify(keycloakUserService).removeCredential("user-id", jwt.getIssuer(), "credential-id");
    }

    private static Jwt jwt(String tokenValue, String subject, String realm) {
        Instant now = Instant.now();
        return Jwt.withTokenValue(tokenValue)
            .header("alg", "none")
            .issuer(KEYCLOAK_URL + "/realms/" + realm)
            .subject(subject)
            .issuedAt(now)
            .expiresAt(now.plusSeconds(300))
            .build();
    }

    private static CredentialRepresentation credential(String id, String type) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setId(id);
        credential.setType(type);
        return credential;
    }
}
