package de.tum.cit.aet.core.util;

import java.util.stream.Collectors;

/**
 * Helpers for string manipulation and normalization.
 */
public class StringUtil {

    private StringUtil() {}

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

    public static boolean isBlank(String input) {
        return input == null || input.trim().isEmpty();
    }

    /**
     * Normalizes the search query by trimming whitespace, converting to lowercase,
     * and returning null if the result is empty.
     *
     * @param searchQuery the raw search query
     * @return normalized search query or null if empty
     */
    public static String normalizeSearchQuery(String searchQuery) {
        if (searchQuery == null) {
            return null;
        }
        String normalized = searchQuery.trim().replaceAll("\\s+", " ").toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }

    /**
     * Keeps only ASCII characters and German umlauts in the input string.
     * All other characters are replaced with a space.
     *
     * @param input the original string
     * @return a string containing only ASCII and German umlaut characters, other
     *         characters replaced with space
     */
    public static String keepAsciiAndUmlauts(String input) {
        if (input == null) return "";
        return input
            .chars()
            .mapToObj(c -> (c < 128 || "ßäöüÄÖÜ".indexOf(c) >= 0) ? String.valueOf((char) c) : " ")
            .collect(Collectors.joining());
    }

    /**
     * Removes common punctuation characters from the input string.
     * Useful for tokenizing words without extra symbols.
     *
     * @param input the original string
     * @return a string with punctuation replaced by spaces
     */
    public static String removePunctuation(String input) {
        if (input == null) return "";
        return input.replaceAll("[.\\t,\"'<>*?!\\[\\]@:;()./&]", " ");
    }

    /**
     * Normalizes whitespace in a string by collapsing multiple spaces into a single
     * space.
     * Leading and trailing whitespace are also removed.
     *
     * @param input the original string
     * @return a string with normalized whitespace
     */
    public static String normalizeWhitespace(String input) {
        if (input == null) return "";
        return input.replaceAll("\\s+", " ").trim();
    }
}
