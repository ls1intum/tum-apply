package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.GenderBiasAnalysisRequest;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.core.service.GenderBiasAnalysisService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for gender bias analysis
 */
@RestController
@RequestMapping("/api/gender-bias")
public class GenderBiasAnalysisResource {

    private final GenderBiasAnalysisService analysisService;

    public GenderBiasAnalysisResource(GenderBiasAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    /**
     * POST /api/gender-bias/analyze : Analyze text for gender bias
     *
     * @param request the text to analyze
     * @return the analysis result
     */
    @PostMapping("/analyze")
    public ResponseEntity<GenderBiasAnalysisResponse> analyzeText(@Valid @RequestBody GenderBiasAnalysisRequest request) {
        // Default to English if no language specified
        String language = request.getLanguage() != null ? request.getLanguage() : "en";

        GenderBiasAnalysisResponse response = analysisService.analyzeText(request.getText(), language);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/gender-bias/analyze-html : Analyze HTML content (extract text
     * first)
     * Useful for Quill editor content
     *
     * @param request the HTML to analyze
     * @return the analysis result
     */
    @PostMapping("/analyze-html")
    public ResponseEntity<GenderBiasAnalysisResponse> analyzeHtmlContent(@Valid @RequestBody GenderBiasAnalysisRequest request) {
        // Strip HTML tags to get plain text
        String plainText = stripHtml(request.getText());

        String language = request.getLanguage() != null ? request.getLanguage() : "en";

        GenderBiasAnalysisResponse response = analysisService.analyzeText(plainText, language);

        return ResponseEntity.ok(response);
    }

    /**
     * Simple HTML tag stripper
     * For production, consider using a library like Jsoup
     */
    private String stripHtml(String html) {
        if (html == null) return "";

        // Remove HTML tags
        String text = html.replaceAll("<[^>]*>", " ");

        // Decode common HTML entities
        text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");

        // Normalize whitespace
        text = text.replaceAll("\\s+", " ").trim();

        return text;
    }
}
