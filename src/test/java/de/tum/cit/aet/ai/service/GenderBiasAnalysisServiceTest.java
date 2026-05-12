package de.tum.cit.aet.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import de.tum.cit.aet.ai.constants.GenderCategory;
import de.tum.cit.aet.ai.domain.BiasedIssue;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class GenderBiasAnalysisServiceTest {

    private static final String NON_INCLUSIVE_ENGLISH_TEXT = "The candidate should be a strong leader with competitive skills.";
    private static final String INCLUSIVE_ENGLISH_TEXT = "The candidate should be supportive, collaborative, and understanding.";
    private static final String NEUTRAL_ENGLISH_TEXT =
        "The candidate should be a strong leader and decisive, but also supportive and collaborative.";
    private static final String EMPTY_ENGLISH_TEXT = "The candidate should be very nice.";
    private static final String NON_INCLUSIVE_GERMAN_TEXT = "Wir suchen eine durchsetzungsfähige Person mit analytischen Fähigkeiten.";
    private static final String INCLUSIVE_GERMAN_TEXT = "Die Person sollte kooperativ, einfühlsam und verständnisvoll sein.";
    private static final String NEUTRAL_GERMAN_TEXT =
        "Die Person sollte durchsetzungsfähig und ehrgeizig sein, aber auch einfühlsam und verständnisvoll.";
    private static final String EMPTY_GERMAN_TEXT = "Die Person sollte sich gut einbringen können.";
    private static final String SPECIAL_CHARACTER_TEXT = "The candidate should be: competitive & analytical @ wörk;";
    private static final String HYPHENED_TEXT = "The candidate should be supportive, co-operativ, and understanding with a high-quality.";

    private GenderBiasAnalysisService service;

    @BeforeEach
    void setUp() {
        service = new GenderBiasAnalysisService(new GenderBiasAnalyzer());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("analyzeTextCases")
    void shouldAnalyzeGenderBias(String label, String text, String language, List<ExpectedBiasedIssue> expected) {
        List<BiasedIssue> result = service.analyzeText(text, language);

        assertAnalysis(result, language, expected);
    }

    @Test
    void shouldDefaultToEnglishWhenLanguageIsBlank() {
        List<BiasedIssue> result = service.analyzeText(NON_INCLUSIVE_ENGLISH_TEXT, "");

        assertAnalysis(
            result,
            "en",
            List.of(
                new ExpectedBiasedIssue("leader", GenderCategory.NON_INCLUSIVE),
                new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE)
            )
        );
    }

    @Test
    void shouldReturnEmptyAnalysisForNullText() {
        List<BiasedIssue> result = service.analyzeText(null, "en");

        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnEmptyAnalysisForBlankText() {
        List<BiasedIssue> result = service.analyzeText("", "en");

        assertThat(result).isEmpty();
    }

    @Test
    void shouldHandleVeryLongText() {
        String longText = "competitive analytical decisive leader ".repeat(1000);

        List<BiasedIssue> result = service.analyzeText(longText, "en");

        assertThat(result)
            .hasSize(4000)
            .allSatisfy(issue -> {
                assertThat(issue.getLanguage()).isEqualTo("en");
                assertThat(issue.getType()).isEqualTo(GenderCategory.NON_INCLUSIVE);
            });
    }

    @Test
    void shouldHandleMixedCaseWords() {
        List<BiasedIssue> result = service.analyzeText("The candidate should be COMPETITIVE and Analytical", "en");

        assertAnalysis(
            result,
            "en",
            List.of(
                new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE),
                new ExpectedBiasedIssue("analytical", GenderCategory.NON_INCLUSIVE)
            )
        );
    }

    @Test
    void shouldHandleRepeatedWords() {
        List<BiasedIssue> result = service.analyzeText("competitive competitive competitive competitive", "en");

        assertThat(result)
            .hasSize(4)
            .allSatisfy(issue -> {
                assertThat(issue.getLanguage()).isEqualTo("en");
                assertThat(issue.getWord()).isEqualTo("competitive");
                assertThat(issue.getType()).isEqualTo(GenderCategory.NON_INCLUSIVE);
            });
    }

    static Stream<Arguments> analyzeTextCases() {
        return Stream.of(
            Arguments.of(
                "non-inclusive English",
                NON_INCLUSIVE_ENGLISH_TEXT,
                "en",
                List.of(
                    new ExpectedBiasedIssue("leader", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE)
                )
            ),
            Arguments.of(
                "inclusive English",
                INCLUSIVE_ENGLISH_TEXT,
                "en",
                List.of(
                    new ExpectedBiasedIssue("supportive", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("collaborative", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("understanding", GenderCategory.INCLUSIVE)
                )
            ),
            Arguments.of(
                "neutral English",
                NEUTRAL_ENGLISH_TEXT,
                "en",
                List.of(
                    new ExpectedBiasedIssue("leader", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("decisive", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("supportive", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("collaborative", GenderCategory.INCLUSIVE)
                )
            ),
            Arguments.of("empty English", EMPTY_ENGLISH_TEXT, "en", List.of()),
            Arguments.of(
                "non-inclusive German",
                NON_INCLUSIVE_GERMAN_TEXT,
                "de",
                List.of(
                    new ExpectedBiasedIssue("durchsetzungsfähige", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("analytischen", GenderCategory.NON_INCLUSIVE)
                )
            ),
            Arguments.of(
                "inclusive German",
                INCLUSIVE_GERMAN_TEXT,
                "de",
                List.of(
                    new ExpectedBiasedIssue("kooperativ", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("einfühlsam", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("verständnisvoll", GenderCategory.INCLUSIVE)
                )
            ),
            Arguments.of(
                "neutral German",
                NEUTRAL_GERMAN_TEXT,
                "de",
                List.of(
                    new ExpectedBiasedIssue("durchsetzungsfähig", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("ehrgeizig", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("einfühlsam", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("verständnisvoll", GenderCategory.INCLUSIVE)
                )
            ),
            Arguments.of("empty German", EMPTY_GERMAN_TEXT, "de", List.of()),
            Arguments.of(
                "special characters English",
                SPECIAL_CHARACTER_TEXT,
                "en",
                List.of(
                    new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE),
                    new ExpectedBiasedIssue("analytical", GenderCategory.NON_INCLUSIVE)
                )
            ),
            Arguments.of(
                "hyphenated English",
                HYPHENED_TEXT,
                "en",
                List.of(
                    new ExpectedBiasedIssue("supportive", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("co-operativ", GenderCategory.INCLUSIVE),
                    new ExpectedBiasedIssue("understanding", GenderCategory.INCLUSIVE)
                )
            )
        );
    }

    private void assertAnalysis(List<BiasedIssue> result, String expectedLanguage, List<ExpectedBiasedIssue> expected) {
        if (expected.isEmpty()) {
            assertThat(result).isEmpty();
            return;
        }

        assertThat(result)
            .allSatisfy(issue -> {
                assertThat(issue.getLanguage()).isEqualTo(expectedLanguage);
            })
            .extracting(BiasedIssue::getWord, BiasedIssue::getType)
            .containsExactlyElementsOf(
                expected
                    .stream()
                    .map(issue -> tuple(issue.word(), issue.type()))
                    .toList()
            );
    }

    private record ExpectedBiasedIssue(String word, GenderCategory type) {}
}
