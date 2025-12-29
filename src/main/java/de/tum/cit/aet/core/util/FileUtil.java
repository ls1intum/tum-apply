package de.tum.cit.aet.core.util;

public final class FileUtil {

    private FileUtil() {}

    /**
     * Sanitizes a filename by replacing illegal characters with underscores and limiting the length.
     *
     * @param input the filename to sanitize
     * @return the sanitized filename
     */
    public static String sanitizeFilename(String input) {
        if (input == null || input.isBlank()) {
            return "file";
        }
        String cleaned = input.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]+", "_").trim();

        // limit length (some file systems break >255 chars)
        if (cleaned.length() > 120) {
            cleaned = cleaned.substring(0, 120);
        }

        return cleaned;
    }
}
