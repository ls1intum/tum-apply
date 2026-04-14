package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.service.ComplianceIssue;
import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ComplianceService {

    private static final double FACTOR_NEUTRAL = 1.0;
    private static final double FACTOR_NON_INCLUSIVE = 0.5;
    private static final double PENALTY_FACTOR = 0.85;

    /**
     * Calculates a legal compliance score based on a hierarchical risk model.
     */
    protected int calculateLegalScore(List<ComplianceIssue> compliance) {
        if (compliance == null || compliance.isEmpty()) {
            return 100;
        }

        long criticalCount = compliance.stream()
                .filter(i -> "CRITICAL_AGG".equals(i.getCategory()))
                .count();

        if (criticalCount > 0) {
            return 0;
        }

        long transparencyCount = compliance.stream()
                .filter(i -> "TRANSPARENCY".equals(i.getCategory()))
                .count();

        double score = 100.0 * Math.pow(PENALTY_FACTOR, transparencyCount);
        return (int) Math.max(0, Math.round(score));
    }

    /**
     * Calculates the combined gender bias score across two languages.
     */
    public int calculateCombinedScore(GenderBiasAnalysisResponse originalAnalysis, GenderBiasAnalysisResponse translatedAnalysis) {
        int scoreDE = calculateScore(originalAnalysis);
        int scoreEN = calculateScore(translatedAnalysis);
        return (int) Math.round((scoreDE + scoreEN) / 2.0);
    }

    /**
     * Determines the final gender score from available analyses.
     */
    protected int calculateGenderScore(GenderBiasAnalysisResponse originalAnalysis, GenderBiasAnalysisResponse translatedAnalysis) {
        if (originalAnalysis != null && translatedAnalysis != null) {
            return calculateCombinedScore(originalAnalysis, translatedAnalysis);
        }
        if (originalAnalysis != null) {
            return calculateScore(originalAnalysis);
        }
        if (translatedAnalysis != null) {
            return calculateScore(translatedAnalysis);
        }
        return 0;
    }

    /**
     * Calculates the gender-bias score from one analysis result.
     */
    protected int calculateScore(GenderBiasAnalysisResponse analysis) {
        if (analysis == null) {
            return 100;
        }

        if ("empty".equals(analysis.coding())) {
            boolean hasWords = analysis.biasedWords() != null && !analysis.biasedWords().isEmpty();
            return hasWords ? 0 : 100;
        }

        List<BiasedWordDTO> biasedWords = analysis.biasedWords() != null ? analysis.biasedWords() : Collections.emptyList();

        long inclusiveCount = biasedWords.stream().filter(word -> "inclusive".equals(word.type())).count();
        long nonInclusiveCount = biasedWords.stream().filter(word -> "non-inclusive".equals(word.type())).count();

        if (nonInclusiveCount == 0) {
            return 100;
        }

        double totalCount = (double) inclusiveCount + (double) nonInclusiveCount;
        double inclusiveWeight = inclusiveCount / totalCount;

        double factor = getCodingFactor(analysis.coding());
        double score = Math.sqrt(inclusiveWeight * factor) * 100.0;

        return (int) Math.max(0, Math.min(100, Math.round(score)));
    }

    private double getCodingFactor(String coding) {
        return switch (coding) {
            case "neutral", "inclusive-coded" -> FACTOR_NEUTRAL;
            default -> FACTOR_NON_INCLUSIVE;
        };
    }
}
