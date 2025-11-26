package de.tum.cit.aet;

import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import de.tum.cit.aet.usermanagement.service.KeycloakUserService;
import de.tum.cit.aet.usermanagement.service.UserService;
import java.time.Instant;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@TestConfiguration
public class TestSecurityConfiguration {

    @Bean
    public KeycloakAuthenticationService keycloakAuthenticationService() {
        return Mockito.mock(KeycloakAuthenticationService.class);
    }

    @Bean
    public AuthenticationService authenticationService() {
        return Mockito.mock(AuthenticationService.class);
    }

    @Bean
    public UserService userService() {
        return Mockito.mock(UserService.class);
    }

    @Bean
    public KeycloakUserService keycloakUserService() {
        return Mockito.mock(KeycloakUserService.class);
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
