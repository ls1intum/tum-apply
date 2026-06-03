package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.domain.BiasedIssue;
import de.tum.cit.aet.core.constants.GenderCategory;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import de.tum.cit.aet.core.service.GenderBiasAnalyzer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service for gender bias analysis
 */
@Service
@RequiredArgsConstructor
public class GenderBiasAnalysisService {

    private final GenderBiasAnalyzer analyzer;

    /**
     * Analyze the given text for gender bias.
     *
     * @param text     the text to analyze
     * @param language the language code (e.g., "en" or "de")
     * @return a response containing the analysis result and identified biased words
     */
    public Set<BiasedIssue> analyzeText(String text, String language) {
        // Default to English if no language specified
        String effectiveLanguage = (language == null || language.trim().isEmpty()) ? "en" : language;

        // Perform analysis
        GenderBiasAnalyzer.AnalysisResult result = analyzer.analyze(text, effectiveLanguage);

        // Convert to DTO

        return convertToBiasedIssues(result);
    }

    /**
     * Convert analysis result to DTOs with suggestions
     */
    private Set<BiasedIssue> convertToBiasedIssues(GenderBiasAnalyzer.AnalysisResult result) {
        Set<BiasedIssue> issues = new HashSet<>();

        // Add non inclusive words
        for (String word : result.nonInclusiveWords()) {
            issues.add(new BiasedIssue(result.language(), word, GenderCategory.NON_INCLUSIVE));
        }

        // Add inclusive words
        for (String word : result.inclusiveWords()) {
            issues.add(new BiasedIssue(result.language(), word, GenderCategory.INCLUSIVE));
        }

        return issues;
    }
}
