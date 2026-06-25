package de.tum.cit.aet.core.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * Fails fast at startup (production profile only) when security-critical secrets are left at their built-in
 * development defaults. Mirrors the RSA-key guard in {@code AppTokenKeyConfiguration}.
 * <ul>
 *   <li>{@code security.otp.hmac-secret} also signs the OAuth2 authorization-request cookie; if it kept its
 *       committed default an attacker could forge that cookie.</li>
 *   <li>{@code app.webauthn.rp-id} left at {@code localhost} silently breaks passkeys in production.</li>
 * </ul>
 */
@Component
public class ProductionSecretsGuard {

    private static final String DEFAULT_OTP_HMAC_SECRET = "3vWK1lE1FnrjAovOmWwn8O9xqq5WTtNOY/NUdSAKmoQ=";

    public ProductionSecretsGuard(
        Environment environment,
        @Value("${security.otp.hmac-secret:}") String otpHmacSecret,
        @Value("${app.webauthn.rp-id:localhost}") String webAuthnRpId
    ) {
        if (!environment.acceptsProfiles(Profiles.of("prod"))) {
            return;
        }
        List<String> problems = new ArrayList<>();
        if (otpHmacSecret.isBlank() || DEFAULT_OTP_HMAC_SECRET.equals(otpHmacSecret)) {
            problems.add("OTP_HMAC_SECRET must be set to a unique value (not the built-in default)");
        }
        if (webAuthnRpId.isBlank() || "localhost".equalsIgnoreCase(webAuthnRpId)) {
            problems.add("APP_WEBAUTHN_RP_ID must be set to the production relying-party domain");
        }
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Invalid production security configuration: " + String.join("; ", problems));
        }
    }
}
