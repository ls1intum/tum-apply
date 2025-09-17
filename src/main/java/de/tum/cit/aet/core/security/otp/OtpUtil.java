package de.tum.cit.aet.core.security.otp;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility class for generating and handling one-time passwords (OTPs) and related cryptographic operations.
 */
public final class OtpUtil {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private OtpUtil() {
    }

    /**
     * Generates an alphanumeric OTP consisting of uppercase letters and digits.
     *
     * @param length the desired length of the OTP; must be greater than 0
     * @return a randomly generated alphanumeric OTP string of the specified length
     * @throws IllegalArgumentException if {@code length} is less than or equal to 0
     */
    public static String generateAlphanumeric(int length) {
        if (length <= 0) {
            throw new IllegalArgumentException("length must be > 0");
        }
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(SECURE_RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * Generates a random byte array of the specified length and returns its Base64-encoded string representation.
     *
     * @param len the number of random bytes to generate
     * @return a Base64-encoded string representing the random bytes
     */
    public static String randomBase64(int len) {
        byte[] bytes = new byte[len];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    /**
     * Computes the HMAC-SHA256 hash of the given input string using a Base64-encoded secret key.
     *
     * @param base64Secret the Base64-encoded secret key used for HMAC
     * @param input        the input string to hash
     * @return the Base64-encoded HMAC-SHA256 hash of the input
     * @throws IllegalStateException if the HMAC computation fails due to invalid key or algorithm issues
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
     * Compares two strings in constant time to prevent timing side-channel attacks.
     * Returns {@code false} if either string is {@code null} or if their lengths differ.
     *
     * @param a the first string to compare
     * @param b the second string to compare
     * @return {@code true} if both strings are non-null, have the same length, and are equal; {@code false} otherwise
     */
    public static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] x = a.getBytes(StandardCharsets.UTF_8);
        byte[] y = b.getBytes(StandardCharsets.UTF_8);
        if (x.length != y.length) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < x.length; i++) {
            r |= x[i] ^ y[i];
        }
        return r == 0;
    }
}
