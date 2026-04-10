package de.tum.cit.aet.core.service.export.admin;

import java.util.Locale;
import java.util.UUID;

/**
 * Naming helpers for admin export folder/file paths inside the produced ZIP.
 * Filenames must be safe across operating systems (Windows, macOS, Linux),
 * stay short, and remain stable across re-exports for diff-friendliness.
 */
final class AdminExportNaming {

    private AdminExportNaming() {}

    /** Maximum slug length to keep paths from blowing past Windows' 260-char limit. */
    private static final int MAX_SLUG_LENGTH = 50;

    /** Lowercase, ASCII-safe slug; falls back to {@code untitled} when blank. */
    static String slug(String value) {
        if (value == null || value.isBlank()) {
            return "untitled";
        }
        String cleaned = value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (cleaned.isBlank()) {
            return "untitled";
        }
        return cleaned.length() > MAX_SLUG_LENGTH ? cleaned.substring(0, MAX_SLUG_LENGTH) : cleaned;
    }

    /** First 8 characters of a UUID — collision-resistant enough for folder disambiguation. */
    static String shortId(UUID id) {
        return id == null ? "no_id" : id.toString().substring(0, 8);
    }

    /** Returns the file extension (with leading dot) for common mime types, or empty string. */
    static String extensionForMime(String mimeType) {
        if (mimeType == null) {
            return "";
        }
        return switch (mimeType.toLowerCase(Locale.ROOT)) {
            case "application/pdf" -> ".pdf";
            case "image/png" -> ".png";
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "text/plain" -> ".txt";
            default -> "";
        };
    }
}
