package de.tum.cit.aet.core.config;

import de.tum.cit.aet.core.security.MultiRealmJwtDecoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@Configuration
public class JwtDecoderConfiguration {

    /**
     * Provides a JwtDecoder that accepts tokens from both Keycloak realms used by the application.
     *
     * @param keycloakUrl base URL of the Keycloak instance
     * @param tumLoginRealm name of the TUM IDP/LDAP realm
     * @param externalLoginRealm name of the external login realm
     * @return a decoder that selects the matching realm decoder per token issuer
     */
    @Bean
    public JwtDecoder jwtDecoder(
        @Value("${keycloak.url}") String keycloakUrl,
        @Value("${keycloak.tum-login-realm}") String tumLoginRealm,
        @Value("${keycloak.external-login-realm}") String externalLoginRealm
    ) {
        return new MultiRealmJwtDecoder(keycloakUrl, tumLoginRealm, externalLoginRealm);
    }
}
