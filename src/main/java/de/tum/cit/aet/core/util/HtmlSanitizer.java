package de.tum.cit.aet.core.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class HtmlSanitizer {

    public static String sanitize(String html) {
        return Jsoup.clean(html, Safelist.basic());
    }

    public static String sanitizeQuillMentions(String html) {
        Safelist quillMentionsSafelist = Safelist.basic()
            .addAttributes("span", "class", "data-index", "data-denotation-char", "data-id", "data-value", "contenteditable")
            .addAttributes("p", "class")
            .addAttributes("strong", "class");

        return Jsoup.clean(html, quillMentionsSafelist);
    }
}
