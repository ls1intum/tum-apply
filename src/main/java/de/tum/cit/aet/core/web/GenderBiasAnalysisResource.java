package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.GenderBiasAnalysisRequest;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.service.GenderBiasAnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for gender bias analysis
 */
@Slf4j
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
        log.info("REST request to analyze text for gender bias, language: {}", request.language());

        GenderBiasAnalysisResponse response = analysisService.analyzeText(request.text(), request.language());

        log.info("Gender bias analysis completed: {} biased words found, coding: {}", response.biasedWords().size(), response.coding());

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
        log.info("REST request to analyze HTML content for gender bias, language: {}", request.language());

        // Strip HTML tags to get plain text
        String plainText = Jsoup.parse(request.text()).text();

        GenderBiasAnalysisResponse response = analysisService.analyzeText(plainText, request.language());

        log.info("HTML gender bias analysis completed: {} biased words found", response.biasedWords().size());

        return ResponseEntity.ok(response);
    }
}
