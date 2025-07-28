package de.tum.cit.aet.core.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class HtmlSanitizer {

    /**
     * Sanitizes generic HTML input using a base safelist. Allows basic formatting and anchor tags.
     *
     * @param html the HTML input to sanitize
     * @return sanitized HTML with unsafe elements and attributes removed
     */
    public static String sanitize(String html) {
        return Jsoup.clean(html, BASE_SAFE_LIST());
    }

    /**
     * Sanitizes HTML content produced by the Quill editor, allowing special attributes used for mentions.
     *
     * @param html the HTML input with potential Quill mentions
     * @return sanitized HTML preserving valid mention tags
     */
    public static String sanitizeQuillMentions(String html) {
        Safelist quillMentionsSafelist = BASE_SAFE_LIST()
            .addAttributes("span", "class", "data-index", "data-denotation-char", "data-id", "data-value", "contenteditable")
            .addAttributes("p", "class")
            .addAttributes("strong", "class");

        return Jsoup.clean(html, quillMentionsSafelist);
    }

    /**
     * Defines the base safelist for standard HTML content.
     * Allows basic formatting and safe anchor tags (e.g., <a href="..." target="_blank">).
     *
     * @return a configured {@link Safelist} instance
     */
    private static Safelist BASE_SAFE_LIST() {
        return Safelist.basic().addAttributes("a", "href", "target");
    }
}
