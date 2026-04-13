package de.tum.cit.aet.core.service;

import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;

/**
 * Service for extracting plain text from HTML input.
 */
@Service
public class HtmlTextExtractionService {

    /**
     * Removes all HTML tags and returns the plain text content.
     *
     * @param html HTML input; may be null
     * @return plain text without markup
     */
    public String extractPlainText(String html) {
        return Jsoup.parse(html == null ? "" : html).text();
    }
}
