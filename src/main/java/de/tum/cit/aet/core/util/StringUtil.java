package de.tum.cit.aet.core.util;

public class StringUtil {
    /**
     * Normalizes a string input for consistent storage and comparison.
     * - Trims leading and trailing whitespace.
     * - Returns empty string if input is null.
     * - For emails: lower-cases the result.
     * - For names: preserves case but collapses multiple spaces to single space.
     *
     * @param input   the raw string input (can be null)
     * @param isEmail whether the input should be treated as an email
     * @return normalized string
     */
    public static String normalize(String input, boolean isEmail) {
        if (input == null) {
            return "";
        }
        String value = input.trim();
        if (isEmail) {
            return value.toLowerCase();
        }
        return value.replaceAll("\\s+", " ");
    }
}
