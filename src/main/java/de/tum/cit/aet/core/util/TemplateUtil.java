package de.tum.cit.aet.core.util;

import de.tum.cit.aet.notification.constants.TemplateVariable;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;

@Slf4j
public class TemplateUtil {

    // match FreeMarker variables of format: {VARIABLE_NAME!}
    private static final Pattern FREEMARKER_VAR_PATTERN = Pattern.compile("\\$\\{\\s*([a-zA-Z0-9_]+)!}");

    /**
     * HTML structure used to represent a Quill mention. Injects the variable ID
     * as `data-id` and uses it for value and visible label as well.
     */
    private static final String MENTION_HTML_TEMPLATE =
        "<span class=\"mention\" data-index=\"0\" data-denotation-char=\"\" data-id=\"%s\" data-value=\"%s\">" +
        "<span contenteditable=\"false\">" +
        "<span class=\"ql-mention-denotation-char\">$</span>%s</span></span>";

    private static final Set<String> validVariables = TemplateVariable.getTemplateVariables();

    /**
     * Converts a FreeMarker HTML template to a format compatible with Quill's mention plugin.
     * Recognized variables like <code>${APPLICANT_FIRST_NAME!}</code> in text nodes are replaced with
     * Quill mention HTML nodes. FreeMarker variables inside HTML attributes (e.g. href) are preserved as-is.
     *
     * @param html the input HTML containing FreeMarker variables
     * @return the HTML with mentions rendered for Quill
     */
    public static String convertFreemarkerToQuillMentions(String html) {
        try {
            Document document = Jsoup.parseBodyFragment(html);
            document.outputSettings().prettyPrint(false);

            for (TextNode textNode : document.body().textNodes()) {
                replaceFreemarkerInTextNode(textNode);
            }
            for (Element element : document.body().getAllElements()) {
                for (TextNode textNode : element.textNodes()) {
                    replaceFreemarkerInTextNode(textNode);
                }
            }

            return document.body().html();
        } catch (Exception e) {
            log.error("Failed to convert FreeMarker variables to Quill mentions.", e);
            return html;
        }
    }

    /**
     * Replaces FreeMarker variable patterns in a single text node with Quill mention HTML.
     */
    private static void replaceFreemarkerInTextNode(TextNode textNode) {
        String text = textNode.getWholeText();
        Matcher matcher = FREEMARKER_VAR_PATTERN.matcher(text);
        if (!matcher.find()) {
            return;
        }

        matcher.reset();
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String variable = matcher.group(1);
            if (!validVariables.contains(variable)) {
                log.warn("Unknown template variable '{}'; skipping.", variable);
                continue;
            }
            String mentionHtml = String.format(MENTION_HTML_TEMPLATE, variable, variable, variable);
            matcher.appendReplacement(result, Matcher.quoteReplacement(mentionHtml));
        }
        matcher.appendTail(result);

        textNode.before(result.toString());
        textNode.remove();
    }

    /**
     * Converts Quill mention tags (used in HTML editors) back into
     * FreeMarker expressions for server-side rendering.
     *
     * @param html the HTML with embedded Quill mentions
     * @return HTML containing standard FreeMarker variable syntax
     */
    public static String convertQuillMentionsToFreemarker(String html) {
        try {
            Document document = Jsoup.parseBodyFragment(html);
            Elements mentionElements = document.select("span.mention");

            for (Element mention : mentionElements) {
                String variable = mention.attr("data-id");
                if (!validVariables.contains(variable)) {
                    log.warn("Unknown Quill mention data-id '{}'; skipping.", variable);
                    continue;
                }

                String freemarkerVar = "${" + variable + "!}";
                mention.replaceWith(new TextNode(freemarkerVar));
            }

            return document.body().html();
        } catch (Exception e) {
            log.error("Failed to convert Quill mentions to FreeMarker variables.", e);
            return html;
        }
    }
}
