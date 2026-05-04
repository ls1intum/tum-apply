package de.tum.cit.aet.ai.web;

import de.tum.cit.aet.ai.domain.BiasedIssues;
import de.tum.cit.aet.ai.dto.GenderBiasAnalysisRequest;
import de.tum.cit.aet.ai.service.GenderBiasAnalysisService;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import jakarta.validation.Valid;
import java.util.List;
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
    @ProfessorOrEmployee
    @PostMapping("/analyze")
    public ResponseEntity<List<BiasedIssues>> analyzeText(@Valid @RequestBody GenderBiasAnalysisRequest request) {
        log.info("REST request to analyze text for gender bias, language: {}", request.language());

        List<BiasedIssues> response = analysisService.analyzeText(request.text(), request.language());
        String coding = response.isEmpty() ? "empty" : response.get(0).getCoding();

        log.info("Gender bias analysis completed: {} biased words found, coding: {}", response.size(), coding);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/gender-bias/analyze-html:
     * Extracts the readable plain text from the provided HTML content by removing all HTML tags,
     * and then performs a gender bias analysis on the extracted text.
     *
     * @param request the HTML to analyze
     * @return the analysis result
     */
    @ProfessorOrEmployee
    @PostMapping("/analyze-html")
    public ResponseEntity<List<BiasedIssues>> analyzeHtmlContent(@Valid @RequestBody GenderBiasAnalysisRequest request) {
        log.info("REST request to analyze HTML content for gender bias, language: {}", request.language());

        String plainText = Jsoup.parse(request.text()).text();

        List<BiasedIssues> response = analysisService.analyzeText(plainText, request.language());

        return ResponseEntity.ok(response);
    }
}
