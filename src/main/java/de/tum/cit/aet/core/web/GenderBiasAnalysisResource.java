package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.GenderBiasAnalysisRequest;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.service.GenderBiasAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for gender bias analysis
 */
@RestController
@RequestMapping("/api/gender-bias")
@RequiredArgsConstructor
public class GenderBiasAnalysisResource {

    private final GenderBiasAnalysisService analysisService;

    /**
     * POST /api/gender-bias/analyze : Analyze text for gender bias
     *
     * @param request the text to analyze
     * @return the analysis result
     */
    @Professor
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
     *
     * @param request the HTML to analyze
     * @return the analysis result
     */
    @Professor
    @PostMapping("/analyze-html")
    public ResponseEntity<GenderBiasAnalysisResponse> analyzeHtmlContent(@Valid @RequestBody GenderBiasAnalysisRequest request) {
        // Strip HTML tags to get plain text
        String plainText = Jsoup.parse(request.getText()).text();

        String language = request.getLanguage() != null ? request.getLanguage() : "en";

        GenderBiasAnalysisResponse response = analysisService.analyzeText(plainText, language);

        return ResponseEntity.ok(response);
    }
}
