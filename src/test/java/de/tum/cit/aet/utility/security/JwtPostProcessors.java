// src/test/java/.../security/JwtPostProcessors.java
package de.tum.cit.aet.utility.security;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.junit.jupiter.api.DisplayNameGenerator;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

public final class JwtPostProcessors {

    private JwtPostProcessors() {}

    public static RequestPostProcessor jwtUser(UUID userId, String... roles) {
        Jwt jwt = Jwt.withTokenValue("test-token").header("alg", "none").subject(userId.toString()).build();

        List<SimpleGrantedAuthority> authorities = Arrays.stream(roles).map(SimpleGrantedAuthority::new).collect(Collectors.toList());

        return SecurityMockMvcRequestPostProcessors.authentication(new JwtAuthenticationToken(jwt, authorities));
    }
}
