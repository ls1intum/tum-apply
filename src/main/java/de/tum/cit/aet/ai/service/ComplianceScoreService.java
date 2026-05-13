package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.constants.ComplianceCategory;
import de.tum.cit.aet.ai.domain.BiasedIssue;
import de.tum.cit.aet.ai.domain.ComplianceIssue;
import de.tum.cit.aet.core.constants.GenderCategory;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ComplianceScoreService {

    private static final double FACTOR_NEUTRAL = 1.0;
    private static final double FACTOR_NON_INCLUSIVE = 0.5;
    private static final double PENALTY_FACTOR = 0.85;

    /**
     * Calculates a legal compliance score based on a hierarchical risk model.
     * * The calculation follows the Gatekeeper-Principle for severe risks and Exponential Decay
     * for minor issues. If a CRITICAL_AGG violation is detected, the score is immediately 0
     * (Veto-Principle), as these represent non-negotiable legal liabilities.
     * * For transparency issues, the score is reduced multiplicatively using the formula
     * S(n) = 100 * 0.85^n. The decay factor of 0.85 is set to trigger a critical
     * threshold (~60%) after three cumulative issues, reflecting the diminishing
     * marginal quality of the job description. This approach mirrors risk assessment
     * standards like ISO 31000 and prevents negative scores common in linear models.
     *
     * @param compliance the structured analysis containing identified compliance issues
     * @return an integer score from 0 to 100 representing legal integrity
     */
    protected int calculateLegalScore(List<ComplianceIssue> compliance) {
        if (compliance == null || compliance.isEmpty()) {
            return 100;
        }

        long criticalCount = compliance
            .stream()
            .filter(i -> ComplianceCategory.CRITICAL_AGG == i.getCategory())
            .count();

        if (criticalCount > 0) {
            return 0;
        }

        long transparencyCount = compliance
            .stream()
            .filter(i -> ComplianceCategory.TRANSPARENCY == i.getCategory())
            .count();

        double score = 100.0 * Math.pow(PENALTY_FACTOR, transparencyCount);
        return (int) Math.max(0, Math.round(score));
    }

    /**
     * Calculates the combined gender bias score across two languages for consistency.
     *
     * @param originalAnalysis The analysis results for the primary description language.
     * @param translatedAnalysis The analysis results for the secondary/translated language.
     * @param originalText - The original text for score-calculation
     * @return the combined gender bias score (0-100)
     */
    public int calculateCombinedScore(List<BiasedIssue> originalAnalysis, List<BiasedIssue> translatedAnalysis, String originalText) {
        int scoreDE = calculateScore(originalAnalysis, originalText);
        int scoreEN = calculateScore(translatedAnalysis, originalText);
        return (int) Math.round((scoreDE + scoreEN) / 2.0);
    }

    /**
     * Determines the final gender score from available analyses.
     * This approach ensures scoring stability and consistency across multilingual job descriptions after
     * translation.
     *
     * @param originalAnalysis Analysis results for the primary description language.
     * @param translatedAnalysis Analysis results for the secondary/translated language.
     * @param originalText - The original text for score-calculation
     * @return A compiled integer score (0-100) based on the most comprehensive data available.
     */
    protected int calculateGenderScore(List<BiasedIssue> originalAnalysis, List<BiasedIssue> translatedAnalysis, String originalText) {
        //If both language versions are available, the combined version is set.
        if (originalAnalysis != null && translatedAnalysis != null) {
            return calculateCombinedScore(originalAnalysis, translatedAnalysis, originalText);
        }
        //If only one lang is present, it falls back to the single-language score calculation.
        if (originalAnalysis != null) {
            return calculateScore(originalAnalysis, originalText);
        }
        if (translatedAnalysis != null) {
            return calculateScore(translatedAnalysis, originalText);
        }
        return 0;
    }

    /**
     * Calculates the compliance score from one gender analysis result.
     * The calculation is performed in several steps:
     * 1) Calculates the ratio (`inclusiveWeight`) of inclusive words to the total number of flagged words (inclusive + non-inclusive)
     * 2) Applies a penalty factor based on the overall coding of the analysis:
     * - 'neutral-coded': 1.0 (no penalty)
     * - 'inclusive-coded': 1.0 (no penalty))
     * - 'non-inclusive-coded': 0.5 (penalty)
     * 3) The final score is derived from the square root of (`inclusiveWeight` * factor) and scaled to a 0-100 range.
     * The square root is applied to soften the penalty curve and avoid overly harsh scores.
     *
     * @param analysis - The result of the gender bias analysis.
     * @param originalText - The original text for score-calculation
     * @returns An integer between 0 and 100 representing the inclusivity score.
     */
    protected int calculateScore(List<BiasedIssue> analysis, String originalText) {
        if (originalText == null || originalText.trim().isEmpty()) {
            return 0;
        }

        if (analysis == null || analysis.isEmpty()) {
            return 100;
        }

        long inclusiveCount = analysis
            .stream()
            .filter(issue -> GenderCategory.INCLUSIVE.equals(issue.getType()))
            .count();
        long nonInclusiveCount = analysis
            .stream()
            .filter(issue -> GenderCategory.NON_INCLUSIVE.equals(issue.getType()))
            .count();

        if (nonInclusiveCount == 0) {
            return 100;
        }

        double totalCount = (double) inclusiveCount + (double) nonInclusiveCount;
        double inclusiveWeight = inclusiveCount / totalCount;

        double factor = nonInclusiveCount > inclusiveCount ? FACTOR_NON_INCLUSIVE : FACTOR_NEUTRAL;
        double score = Math.sqrt(inclusiveWeight * factor) * 100.0;

        return (int) Math.max(0, Math.min(100, Math.round(score)));
    }
}
