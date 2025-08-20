package de.tum.cit.aet.core.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "security.otp")
public class OtpProperties {
    // length of the otp code
    private int length = 8;
    // valid duration in seconds (e.g. 900 = 15 min)
    private long ttlSeconds = 900;
    // max. attempts per code
    private int maxAttempts = 6;
    // cooldown to resend a new code (in seconds)
    private long resendCooldownSeconds = 60;
    // HMAC-secret (Base64), must be set (ENV/Secret Manager) */
    private String hmacSecret;
}
