package de.tum.cit.aet.core.util;

import de.tum.cit.aet.core.constants.TemplateVariable;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;

public class TemplateUtil {

    private static final Pattern FREEMARKER_VAR_PATTERN = Pattern.compile("\\$\\{\\s*([a-zA-Z0-9_]+)!?}");

    private static final String MENTION_HTML_TEMPLATE =
        "<span class=\"mention\" data-index=\"0\" data-denotation-char=\"\" data-id=\"%s\" data-value=\"%s\">" +
        "<span contenteditable=\"false\">" +
        "<span class=\"ql-mention-denotation-char\">$</span>%s</span></span>";

    private static final Set<String> validVariables = TemplateVariable.getTemplateVariables();

    /**
     * Converts Freemarker-style variables like ${APPLICANT_FIRST_NAME!} to Quill mention span HTML.
     */
    public static String convertFreemarkerToQuillMentions(String html) {
        Matcher matcher = FREEMARKER_VAR_PATTERN.matcher(html);
        StringBuilder result = new StringBuilder();

        while (matcher.find()) {
            String variable = matcher.group(1);
            if (!validVariables.contains(variable)) {
                continue; // Skip unknown variables
            }
            String mentionHtml = String.format(MENTION_HTML_TEMPLATE, variable, variable, variable);
            matcher.appendReplacement(result, Matcher.quoteReplacement(mentionHtml));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    /**
     * Converts Quill mention span HTML back to Freemarker-style variables like ${APPLICANT_FIRST_NAME!},
     * using Jsoup for safe and robust HTML parsing.
     */
    public static String convertQuillMentionsToFreemarker(String html) {
        Document document = Jsoup.parseBodyFragment(html);
        Elements mentionElements = document.select("span.mention");

        for (Element mention : mentionElements) {
            String variable = mention.attr("data-id");
            if (!validVariables.contains(variable)) {
                continue; // Ignore unknown variables
            }

            String freemarkerVar = "${" + variable + "!}";
            mention.replaceWith(new TextNode(freemarkerVar));
        }

        // Return the body content without surrounding <body> tags
        return document.body().html();
    }
}
