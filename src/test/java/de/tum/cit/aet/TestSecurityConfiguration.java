package de.tum.cit.aet;

import java.time.Instant;
import java.util.UUID;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@TestConfiguration
public class TestSecurityConfiguration {

    @Bean
    public JwtDecoder jwtDecoder() {
        UUID fixedUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        return token ->
            Jwt.withTokenValue(token)
                .header("alg", "none")
                .claim("sub", fixedUserId)
                .claim("email", "authenticated@example.com") // muss zu deinem Test passen!
                .claim("preferred_username", "authenticated@example.com")
                .claim("given_name", "Test")
                .claim("family_name", "User")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
    }
}
