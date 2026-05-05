package de.tum.cit.aet.core.config;

import de.tum.cit.aet.core.security.MultiRealmJwtDecoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@Configuration
public class JwtDecoderConfiguration {

    @Bean
    public JwtDecoder jwtDecoder(
        @Value("${keycloak.url}") String keycloakUrl,
        @Value("${keycloak.tum-login-realm}") String tumLoginRealm,
        @Value("${keycloak.external-login-realm}") String externalLoginRealm
    ) {
        return new MultiRealmJwtDecoder(keycloakUrl, tumLoginRealm, externalLoginRealm);
    }
}
