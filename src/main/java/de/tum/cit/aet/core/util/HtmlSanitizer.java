package de.tum.cit.aet.core.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class HtmlSanitizer {

    public static String sanitize(String html) {
        return Jsoup.clean(html, BASE_SAFE_LIST());
    }

    public static String sanitizeQuillMentions(String html) {
        Safelist quillMentionsSafelist = BASE_SAFE_LIST()
            .addAttributes("span", "class", "data-index", "data-denotation-char", "data-id", "data-value", "contenteditable")
            .addAttributes("p", "class")
            .addAttributes("strong", "class");

        return Jsoup.clean(html, quillMentionsSafelist);
    }

    private static Safelist BASE_SAFE_LIST() {
        return Safelist.basic().addAttributes("a", "href", "target");
    }
}
