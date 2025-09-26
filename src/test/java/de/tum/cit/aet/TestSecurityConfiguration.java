package de.tum.cit.aet;

import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.time.Instant;

@TestConfiguration
public class TestSecurityConfiguration {
    @Bean
    public KeycloakAuthenticationService keycloakAuthenticationService() {
        return Mockito.mock(KeycloakAuthenticationService.class);
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return token ->
            Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("email", "authenticated@example.com")
                .claim("preferred_username", "authenticated@example.com")
                .claim("given_name", "Test")
                .claim("family_name", "User")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
    }
}
