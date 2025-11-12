package de.tum.cit.aet.core.util;

public class HtmlTextExtractor {

    private HtmlTextExtractor() {}

    /**
     * Converts HTML content into plain readable text.
     * Removes tags, decodes common entities, and normalizes whitespace.
     *
     * @param html raw HTML input
     * @return plain text content
     */
    public static String stripHtml(String html) {
        if (html == null) return "";

        String text = html.replaceAll("<[^>]*>", " ");
        text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");
        return text.replaceAll("\\s+", " ").trim();
    }
}
