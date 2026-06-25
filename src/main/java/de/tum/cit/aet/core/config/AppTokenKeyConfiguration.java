package de.tum.cit.aet.core.config;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.util.StringUtils;

/**
 * Wires the signing material that lets TUMApply mint its own JWTs for applicants.
 * <p>
 * The RSA keypair is loaded from configuration (PEM via environment/secret). When no key is configured
 * an ephemeral keypair is generated at startup — acceptable for local development only; the production
 * profile fails fast if {@code app.token.rsa-private-key} is missing, because an ephemeral key would
 * invalidate every session on restart and break a multi-instance deployment.
 */
@Slf4j
@Configuration
public class AppTokenKeyConfiguration {

    private final String privateKeyPem;
    private final String publicKeyPem;
    private final String kid;
    private final String issuer;

    public AppTokenKeyConfiguration(
        @Value("${app.token.rsa-private-key:}") String privateKeyPem,
        @Value("${app.token.rsa-public-key:}") String publicKeyPem,
        @Value("${app.token.kid:tumapply}") String kid,
        @Value("${app.token.issuer}") String issuer,
        Environment environment
    ) {
        this.privateKeyPem = privateKeyPem;
        this.publicKeyPem = publicKeyPem;
        this.kid = kid;
        this.issuer = issuer;
        if (!StringUtils.hasText(privateKeyPem) && environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException(
                "app.token.rsa-private-key (APP_TOKEN_RSA_PRIVATE_KEY) must be set in the prod profile; " +
                "an ephemeral signing key would invalidate all sessions on restart."
            );
        }
    }

    /**
     * The RSA JWK used to sign and verify app-issued tokens. Built from the configured PEM keypair,
     * or generated ephemerally when none is configured (dev only).
     *
     * @return the RSA signing key (with private key material) and a stable key id
     */
    @Bean
    public RSAKey appSigningRsaKey() {
        try {
            RSAPublicKey publicKey;
            RSAPrivateKey privateKey;
            if (StringUtils.hasText(privateKeyPem) && StringUtils.hasText(publicKeyPem)) {
                publicKey = parsePublicKey(publicKeyPem);
                privateKey = parsePrivateKey(privateKeyPem);
            } else {
                log.warn(
                    "No app.token RSA keypair configured - generating an EPHEMERAL signing key. " +
                    "Tokens will not survive a restart. Configure APP_TOKEN_RSA_PRIVATE_KEY/PUBLIC_KEY for any shared environment."
                );
                KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
                generator.initialize(2048);
                KeyPair keyPair = generator.generateKeyPair();
                publicKey = (RSAPublicKey) keyPair.getPublic();
                privateKey = (RSAPrivateKey) keyPair.getPrivate();
            }
            return new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(kid)
                .keyUse(KeyUse.SIGNATURE)
                .algorithm(JWSAlgorithm.RS256)
                .build();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize app token signing key", e);
        }
    }

    /**
     * JWK source backing both the encoder and the published JWKS. Returns a {@link JWKSet} (list) so a
     * future key rotation only needs to add the new key here while old public keys remain trusted.
     *
     * @param appSigningRsaKey the application's RSA signing key
     * @return an immutable JWK source containing the signing key
     */
    @Bean
    public JWKSource<SecurityContext> appJwkSource(RSAKey appSigningRsaKey) {
        return new ImmutableJWKSet<>(new JWKSet(appSigningRsaKey));
    }

    /**
     * Encoder used by {@code AppTokenService} to sign access and refresh tokens.
     *
     * @param appJwkSource the JWK source holding the signing key
     * @return a Nimbus-backed JWT encoder
     */
    @Bean
    public JwtEncoder appJwtEncoder(JWKSource<SecurityContext> appJwkSource) {
        return new NimbusJwtEncoder(appJwkSource);
    }

    /**
     * Decoder for app-issued tokens. Verifies the signature against the local public key (no network)
     * and validates the issuer and timestamps. Wired into {@code MultiRealmJwtDecoder} for the app issuer.
     *
     * @param appSigningRsaKey the application's RSA signing key (its public part is used to verify)
     * @return a local decoder for app-issued tokens
     * @throws JOSEException if the public key cannot be derived from the JWK
     */
    @Bean("appJwtDecoder")
    public JwtDecoder appJwtDecoder(RSAKey appSigningRsaKey) throws JOSEException {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(appSigningRsaKey.toRSAPublicKey())
            .signatureAlgorithm(SignatureAlgorithm.RS256)
            .build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));
        return decoder;
    }

    private static RSAPrivateKey parsePrivateKey(String pem) throws Exception {
        byte[] der = Base64.getDecoder().decode(stripPem(pem));
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private static RSAPublicKey parsePublicKey(String pem) throws Exception {
        byte[] der = Base64.getDecoder().decode(stripPem(pem));
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
    }

    /**
     * Normalizes a PEM string (env vars often carry literal {@code \n}) and strips the armor + whitespace,
     * leaving only the base64 body.
     */
    private static String stripPem(String pem) {
        return pem.replace("\\n", "\n").replaceAll("-----[^-]+-----", "").replaceAll("\\s+", "");
    }
}
