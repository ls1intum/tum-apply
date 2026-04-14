package de.tum.cit.aet.ai.service;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.ai.dto.ComplianceIssue;
import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ComplianceServiceTest {

    private ComplianceService complianceService;

    @BeforeEach
    void setUp() {
        complianceService = new ComplianceService();
    }

    @Test
    void shouldReturnHundredLegalScoreWhenComplianceIssuesAreEmpty() {
        int score = complianceService.calculateLegalScore(List.of());

        assertThat(score).isEqualTo(100);
    }

    @Test
    void shouldReturnZeroLegalScoreWhenCriticalAggIssueExists() {
        List<ComplianceIssue> issues = List.of(
            new ComplianceIssue("1", "CRITICAL_AGG", "I don't allow disabled applicants", "§ 1 AGG", "Discriminatory sentence", "REPLACE")
        );

        int score = complianceService.calculateLegalScore(issues);

        assertThat(score).isZero();
    }

    @Test
    void shouldApplyTransparencyPenaltyWhenOnlyTransparencyIssuesExist() {
        List<ComplianceIssue> issues = List.of(
            new ComplianceIssue("1", "TRANSPARENCY", "Shared with partner A", "Art. 13 DSGVO", "Missing disclosure", "ADD"),
            new ComplianceIssue("2", "TRANSPARENCY", "Shared with partner B", "Art. 13 DSGVO", "Missing disclosure", "ADD")
        );

        int score = complianceService.calculateLegalScore(issues);

        assertThat(score).isEqualTo(72);
    }

    @Test
    void shouldCalculateCombinedGenderScoreWhenBothAnalysesArePresent() {
        GenderBiasAnalysisResponse original = new GenderBiasAnalysisResponse(
            "text",
            List.of(new BiasedWordDTO("team", "inclusive")),
            "inclusive-coded",
            "en"
        );
        GenderBiasAnalysisResponse translated = new GenderBiasAnalysisResponse(
            "text",
            List.of(new BiasedWordDTO("leader", "non-inclusive"), new BiasedWordDTO("supportive", "inclusive")),
            "neutral",
            "de"
        );

        int score = complianceService.calculateGenderScore(original, translated);

        assertThat(score).isEqualTo(86);
    }

    @Test
    void shouldCalculateSingleLanguageGenderScoreWhenTranslatedAnalysisIsMissing() {
        GenderBiasAnalysisResponse original = new GenderBiasAnalysisResponse(
            "text",
            List.of(new BiasedWordDTO("leader", "non-inclusive"), new BiasedWordDTO("supportive", "inclusive")),
            "neutral",
            "en"
        );

        int score = complianceService.calculateGenderScore(original, null);

        assertThat(score).isEqualTo(71);
    }
}
