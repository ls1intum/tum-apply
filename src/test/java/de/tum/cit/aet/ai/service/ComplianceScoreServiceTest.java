package de.tum.cit.aet.ai.service;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.ai.constants.ComplianceAction;
import de.tum.cit.aet.ai.constants.ComplianceCategory;
import de.tum.cit.aet.ai.domain.BiasedIssue;
import de.tum.cit.aet.ai.domain.ComplianceIssue;
import de.tum.cit.aet.core.constants.GenderCategory;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class ComplianceScoreServiceTest {

    private ComplianceScoreService complianceScoreService;

    @BeforeEach
    void setUp() {
        complianceScoreService = new ComplianceScoreService();
    }

    // ===== CALCULATE LEGAL SCORE =====
    @Nested
    class CalculateLegalScoreTests {

        @Test
        void shouldReturnHundredLegalScoreWhenComplianceIssuesAreEmpty() {
            int score = complianceScoreService.calculateLegalScore(List.of());

            assertThat(score).isEqualTo(100);
        }

        @Test
        void shouldReturnZeroLegalScoreWhenCriticalAggIssueExists() {
            List<ComplianceIssue> issues = List.of(
                new ComplianceIssue(
                    "1",
                    ComplianceCategory.CRITICAL_AGG,
                    "I don't allow disabled applicants",
                    "§ 1 AGG",
                    "Discriminatory sentence",
                    ComplianceAction.REPLACE,
                    "en"
                )
            );

            int score = complianceScoreService.calculateLegalScore(issues);

            assertThat(score).isZero();
        }

        @Test
        void shouldApplyTransparencyPenaltyWhenOnlyTransparencyIssuesExist() {
            List<ComplianceIssue> issues = List.of(
                new ComplianceIssue(
                    "1",
                    ComplianceCategory.TRANSPARENCY,
                    "Shared with partner A",
                    "Art. 13 DSGVO",
                    "Missing disclosure",
                    ComplianceAction.ADD,
                    "en"
                ),
                new ComplianceIssue(
                    "2",
                    ComplianceCategory.TRANSPARENCY,
                    "Shared with partner B",
                    "Art. 13 DSGVO",
                    "Missing disclosure",
                    ComplianceAction.ADD,
                    "en"
                )
            );

            int score = complianceScoreService.calculateLegalScore(issues);

            assertThat(score).isEqualTo(72);
        }
    }

    // ===== CALCULATE GENDER SCORE =====
    @Nested
    class CalculateGenderScoreTests {

        @Test
        void shouldCalculateCombinedGenderScoreWhenBothAnalysesArePresent() {
            List<BiasedIssue> original = List.of(issue("en", "team", GenderCategory.INCLUSIVE));
            List<BiasedIssue> translated = List.of(
                issue("de", "leader", GenderCategory.NON_INCLUSIVE),
                issue("de", "supportive", GenderCategory.INCLUSIVE)
            );

            int score = complianceScoreService.calculateGenderScore(original, translated, "text");

            assertThat(score).isEqualTo(86);
        }

        @Test
        void shouldCalculateSingleLanguageGenderScoreWhenTranslatedAnalysisIsMissing() {
            List<BiasedIssue> original = List.of(
                issue("en", "leader", GenderCategory.NON_INCLUSIVE),
                issue("en", "supportive", GenderCategory.INCLUSIVE)
            );

            int score = complianceScoreService.calculateGenderScore(original, null, "text");

            assertThat(score).isEqualTo(71);
        }

        private BiasedIssue issue(String language, String word, GenderCategory type) {
            return new BiasedIssue(language, word, type);
        }
    }
}
