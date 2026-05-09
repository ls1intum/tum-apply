package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.service.JwtService;
import de.tum.cit.aet.usermanagement.dto.auth.PasskeyActionTokenDTO;
import de.tum.cit.aet.usermanagement.dto.auth.PasskeyDTO;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
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

    @Nested
    class CreatePasskeyActionToken {

        @Test
        void shouldUseIssuingRealmAndAuthorizedPartyWhenJwtCarriesAuthorizedParty() {
            Jwt jwt = jwt("access-token", "user-id", TUM_REALM);
            when(jwtService.getAuthorizedParty(jwt)).thenReturn(SERVER_CLIENT_ID);
            when(jwtService.secondsUntilExpiry(jwt)).thenReturn(120);

            PasskeyActionTokenDTO actual = service.createPasskeyActionToken(jwt);

            assertThat(actual.realm()).isEqualTo(TUM_REALM);
            assertThat(actual.clientId()).isEqualTo(SERVER_CLIENT_ID);
            assertThat(actual.accessToken()).isEqualTo("access-token");
            assertThat(actual.expiresIn()).isEqualTo(120);
        }

        @Test
        void shouldFallBackToBrowserClientWhenAuthorizedPartyMissing() {
            Jwt jwt = jwt("external-token", "external-user", EXTERNAL_REALM);
            when(jwtService.getAuthorizedParty(jwt)).thenReturn(null);
            when(jwtService.secondsUntilExpiry(jwt)).thenReturn(60);

            PasskeyActionTokenDTO actual = service.createPasskeyActionToken(jwt);

            assertThat(actual.realm()).isEqualTo(EXTERNAL_REALM);
            assertThat(actual.clientId()).isEqualTo(BROWSER_CLIENT_ID);
            assertThat(actual.accessToken()).isEqualTo("external-token");
            assertThat(actual.expiresIn()).isEqualTo(60);
        }
    }

    @Nested
    class ListPasskeys {

        @Test
        void shouldReturnOnlyWebAuthnCredentialsWhenAccountHasMixedTypes() {
            Jwt jwt = jwt("access-token", "user-id", EXTERNAL_REALM);
            CredentialRepresentation passwordless = credential("passkey-1", "webauthn-passwordless", "MacBook", 1L);
            CredentialRepresentation webauthn = credential("passkey-2", "WEBAUTHN", "Backup", 2L);
            CredentialRepresentation password = credential("password-1", CredentialRepresentation.PASSWORD, null, null);
            when(keycloakUserService.getCredentials("user-id", jwt.getIssuer())).thenReturn(List.of(passwordless, webauthn, password));

            List<PasskeyDTO> actual = service.listPasskeys(jwt);

            assertThat(actual)
                .containsExactly(new PasskeyDTO("passkey-1", "MacBook", 1L), new PasskeyDTO("passkey-2", "Backup", 2L));
            verify(keycloakUserService).getCredentials("user-id", jwt.getIssuer());
        }
    }

    @Nested
    class RemovePasskey {

        @Test
        void shouldDelegateToKeycloakUserServiceWithTokenIssuer() {
            Jwt jwt = jwt("access-token", "user-id", EXTERNAL_REALM);

            service.removePasskey(jwt, "credential-id");

            verify(keycloakUserService).removeCredential("user-id", jwt.getIssuer(), "credential-id");
        }
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

    private static CredentialRepresentation credential(String id, String type, String label, Long createdDate) {
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setId(id);
        credential.setType(type);
        credential.setUserLabel(label);
        credential.setCreatedDate(createdDate);
        return credential;
    }
}
