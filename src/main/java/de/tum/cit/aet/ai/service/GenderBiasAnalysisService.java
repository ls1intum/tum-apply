package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.constants.GenderCategory;
import de.tum.cit.aet.ai.domain.BiasedIssues;
import java.util.ArrayList;
import java.util.List;
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
    public List<BiasedIssues> analyzeText(String text, String language) {
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
    private List<BiasedIssues> convertToBiasedIssues(GenderBiasAnalyzer.AnalysisResult result) {
        List<BiasedIssues> issues = new ArrayList<>();

        // Add non inclusive words
        for (String word : result.nonInclusiveWords()) {
            issues.add(new BiasedIssues(result.coding(), result.language(), word, GenderCategory.NON_INCLUSIVE));
        }

        // Add inclusive words
        for (String word : result.inclusiveWords()) {
            issues.add(new BiasedIssues(result.coding(), result.language(), word, GenderCategory.INCLUSIVE));
        }

        return issues;
    }
}
