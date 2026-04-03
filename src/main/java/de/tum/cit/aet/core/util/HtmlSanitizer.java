package de.tum.cit.aet.core.util;

import de.tum.cit.aet.notification.constants.TemplateVariable;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

public class HtmlSanitizer {

    private static final String PLACEHOLDER_PREFIX = "https://TEMPLATE_VAR__";
    private static final String PLACEHOLDER_SUFFIX = "__";
    private static final Pattern FREEMARKER_HREF_PATTERN = Pattern.compile("\\$\\{(\\w+?)!?}");
    private static final Set<String> VALID_VARIABLES = TemplateVariable.getTemplateVariables();

    /**
     * Sanitizes generic HTML input using a base safelist. Allows basic formatting and anchor tags.
     * <p>
     * This method must be applied to all user-supplied rich-text content both on write (before
     * persisting to the database) and on read (before sending to the client) as defense-in-depth.
     *
     * @param html the HTML input to sanitize
     * @return sanitized HTML with unsafe elements and attributes removed, or empty string if input is blank
     */
    public static String sanitize(String html) {
        if (StringUtils.isBlank(html)) {
            return "";
        }
        return Jsoup.clean(html, BASE_SAFE_LIST());
    }

    /**
     * Sanitizes HTML content produced by the Quill editor, allowing special attributes used for mentions.
     * Preserves FreeMarker template variables in href attributes (e.g., href="${BOOKING_LINK}") by
     * temporarily replacing them with valid URLs before sanitization and restoring them afterwards.
     *
     * @param html the HTML input with potential Quill mentions
     * @return sanitized HTML preserving valid mention tags and template variable hrefs
     */
    public static String sanitizeQuillMentions(String html) {
        if (StringUtils.isBlank(html)) {
            return "";
        }

        Map<String, String> placeholderMap = new HashMap<>();
        String protectedHtml = protectFreemarkerHrefs(html, placeholderMap);

        Safelist quillMentionsSafelist = BASE_SAFE_LIST()
            .addAttributes("span", "class", "data-index", "data-denotation-char", "data-id", "data-value", "contenteditable")
            .addAttributes("p", "class")
            .addAttributes("strong", "class");

        String sanitized = Jsoup.clean(protectedHtml, quillMentionsSafelist);
        return restoreFreemarkerHrefs(sanitized, placeholderMap);
    }

    /**
     * Replaces FreeMarker expressions in href attributes with placeholder URLs that survive Jsoup sanitization.
     * Only replaces known template variables to prevent abuse.
     */
    private static String protectFreemarkerHrefs(String html, Map<String, String> placeholderMap) {
        Pattern hrefPattern = Pattern.compile("href=\"([^\"]*\\$\\{[^\"]*})\"");
        Matcher hrefMatcher = hrefPattern.matcher(html);
        StringBuilder result = new StringBuilder();

        while (hrefMatcher.find()) {
            String hrefValue = hrefMatcher.group(1);
            Matcher varMatcher = FREEMARKER_HREF_PATTERN.matcher(hrefValue);
            StringBuilder protectedHref = new StringBuilder();

            while (varMatcher.find()) {
                String variable = varMatcher.group(1);
                if (VALID_VARIABLES.contains(variable)) {
                    String placeholder = PLACEHOLDER_PREFIX + variable + PLACEHOLDER_SUFFIX;
                    String original = varMatcher.group(0);
                    placeholderMap.put(placeholder, original);
                    varMatcher.appendReplacement(protectedHref, placeholder);
                }
            }
            varMatcher.appendTail(protectedHref);
            hrefMatcher.appendReplacement(result, Matcher.quoteReplacement("href=\"" + protectedHref + "\""));
        }
        hrefMatcher.appendTail(result);
        return result.toString();
    }

    /**
     * Restores FreeMarker expressions from placeholder URLs after sanitization.
     */
    private static String restoreFreemarkerHrefs(String html, Map<String, String> placeholderMap) {
        String result = html;
        for (Map.Entry<String, String> entry : placeholderMap.entrySet()) {
            result = result.replace(entry.getKey(), entry.getValue());
        }
        return result;
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
