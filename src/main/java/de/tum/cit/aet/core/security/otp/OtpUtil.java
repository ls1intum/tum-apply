package de.tum.cit.aet.core.security.otp;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public final class OtpUtil {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private OtpUtil() {
    }

    /**
     * Generates an alphanumeric OTP (A-Z, a-z, 0-9).
     */
    public static String generateAlphanumeric(int length) {
        if (length <= 0) throw new IllegalArgumentException("length must be > 0");
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(SECURE_RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Returns a Base64 string of len random bytes.
     */
    public static String randomBase64(int len) {
        byte[] bytes = new byte[len];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    /**
     * HMAC-SHA256 over input using a Base64-encoded secret key. Returns Base64 string.
     */
    public static String hmacSha256Base64(String base64Secret, String input) {
        try {
            byte[] secret = Base64.getDecoder().decode(base64Secret);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] out = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure", e);
        }
    }

    /**
     * Constant-time comparison to avoid timing side-channels.
     */
    public static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] x = a.getBytes(StandardCharsets.UTF_8);
        byte[] y = b.getBytes(StandardCharsets.UTF_8);
        if (x.length != y.length) return false;
        int r = 0;
        for (int i = 0; i < x.length; i++) {
            r |= x[i] ^ y[i];
        }
        return r == 0;
    }

    public static String normalizeEmail(String email) {
        if (email == null) return null;
        return email.trim().toLowerCase();
    }
}
