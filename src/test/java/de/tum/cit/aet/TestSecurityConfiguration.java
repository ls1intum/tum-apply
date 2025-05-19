package de.tum.cit.aet;

import java.time.Instant;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@TestConfiguration
public class TestSecurityConfiguration {

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
