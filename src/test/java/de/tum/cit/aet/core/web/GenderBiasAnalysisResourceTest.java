package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.ai.constants.GenderCategory;
import de.tum.cit.aet.ai.domain.BiasedIssues;
import de.tum.cit.aet.ai.dto.GenderBiasAnalysisRequest;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.core.type.TypeReference;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GenderBiasAnalysisResourceTest extends AbstractResourceTest {

    private static final String BASE_URL = "/api/gender-bias";

    /* English Texts */
    private static final String NON_INCLUSIVE_ENGLISH_TEXT = "The candidate should be a strong leader with competitive skills.";
    private static final List<ExpectedBiasedIssue> NON_INCLUSIVE_ENGLISH_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("leader", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE)
    );
    private static final String INCLUSIVE_ENGLISH_TEXT = "The candidate should be supportive, collaborative, and understanding.";
    private static final List<ExpectedBiasedIssue> INCLUSIVE_ENGLISH_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("supportive", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("collaborative", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("understanding", GenderCategory.INCLUSIVE)
    );
    private static final String NEUTRAL_ENGLISH_TEXT =
        "The candidate should be a strong leader and decisive, but also supportive and collaborative.";
    private static final List<ExpectedBiasedIssue> NEUTRAL_ENGLISH_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("leader", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("decisive", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("supportive", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("collaborative", GenderCategory.INCLUSIVE)
    );
    private static final String EMPTY_ENGLISH_TEXT = "The candidate should be very nice.";

    /* German Texts */
    private static final String NON_INCLUSIVE_GERMAN_TEXT = "Wir suchen eine durchsetzungsfähige Person mit analytischen Fähigkeiten.";
    private static final List<ExpectedBiasedIssue> NON_INCLUSIVE_GERMAN_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("durchsetzungsfähige", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("analytischen", GenderCategory.NON_INCLUSIVE)
    );
    private static final String INCLUSIVE_GERMAN_TEXT = "Die Person sollte kooperativ, einfühlsam und verständnisvoll sein.";
    private static final List<ExpectedBiasedIssue> INCLUSIVE_GERMAN_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("kooperativ", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("einfühlsam", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("verständnisvoll", GenderCategory.INCLUSIVE)
    );
    private static final String NEUTRAL_GERMAN_TEXT =
        "Die Person sollte durchsetzungsfähig und ehrgeizig sein, aber auch einfühlsam und verständnisvoll.";
    private static final List<ExpectedBiasedIssue> NEUTRAL_GERMAN_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("durchsetzungsfähig", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("ehrgeizig", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("einfühlsam", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("verständnisvoll", GenderCategory.INCLUSIVE)
    );
    private static final String EMPTY_GERMAN_TEXT = "Die Person sollte sich gut einbringen können.";

    /* Special Texts */
    private static final String SPECIAL_CHARACTER_TEXT = "The candidate should be: competitive & analytical @ wörk;";
    private static final List<ExpectedBiasedIssue> SPECIAL_CHARACTER_LIST = List.of(
        new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("analytical", GenderCategory.NON_INCLUSIVE)
    );
    private static final String HTML_TEXT = "<html><body><h1>Job Description</h1><p>We need a <b>decisive</b> leader</p></body></html>";
    private static final List<ExpectedBiasedIssue> HTML_LIST = List.of(
        new ExpectedBiasedIssue("decisive", GenderCategory.NON_INCLUSIVE),
        new ExpectedBiasedIssue("leader", GenderCategory.NON_INCLUSIVE)
    );
    private static final String HYPHENED_TEXT = "The candidate should be supportive, co-operativ, and understanding with a high-quality.";
    private static final List<ExpectedBiasedIssue> HYPHENED_TEXT_LIST = List.of(
        new ExpectedBiasedIssue("supportive", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("co-operativ", GenderCategory.INCLUSIVE),
        new ExpectedBiasedIssue("understanding", GenderCategory.INCLUSIVE)
    );

    private record ExpectedBiasedIssue(String word, GenderCategory type) {}

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    User professor;
    ResearchGroup researchGroup;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);
    }

    private void assertGenderBiasAnalysisResponse(
        List<BiasedIssues> response,
        String expectedLanguage,
        String expectedCoding,
        List<ExpectedBiasedIssue> expectedBiasedWords
    ) {
        if (expectedBiasedWords == null || expectedBiasedWords.isEmpty()) {
            assertThat(response).isEmpty();
            return;
        }

        assertThat(response)
            .allSatisfy(issue -> {
                assertThat(issue.getLanguage()).isEqualTo(expectedLanguage);
                assertThat(issue.getCoding()).isEqualTo(expectedCoding);
            })
            .extracting(BiasedIssues::getWord, BiasedIssues::getType)
            .containsExactlyElementsOf(
                expectedBiasedWords
                    .stream()
                    .map(issue -> tuple(issue.word(), issue.type()))
                    .toList()
            );
    }

    private List<BiasedIssues> analyzeText(String text, String language) {
        GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(text, language);
        return api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(BASE_URL + "/analyze", request, new TypeReference<List<BiasedIssues>>() {}, 200);
    }

    private List<BiasedIssues> analyzeHtml(String html, String language) {
        GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(html, language);
        return api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(BASE_URL + "/analyze-html", request, new TypeReference<List<BiasedIssues>>() {}, 200);
    }

    @Nested
    class AnalyzeText {

        @ParameterizedTest(name = "{0}")
        @MethodSource("de.tum.cit.aet.core.web.GenderBiasAnalysisResourceTest#analyzeTextCases")
        void shouldDetectExpectedCodingForText(
            String label,
            String text,
            String language,
            String expectedCoding,
            List<ExpectedBiasedIssue> expected
        ) {
            List<BiasedIssues> response = analyzeText(text, language);

            assertGenderBiasAnalysisResponse(response, language, expectedCoding, expected);
        }
    }

    static Stream<Arguments> analyzeTextCases() {
        return Stream.of(
            Arguments.of("non-inclusive English", NON_INCLUSIVE_ENGLISH_TEXT, "en", "non-inclusive-coded", NON_INCLUSIVE_ENGLISH_TEXT_LIST),
            Arguments.of("inclusive English", INCLUSIVE_ENGLISH_TEXT, "en", "inclusive-coded", INCLUSIVE_ENGLISH_TEXT_LIST),
            Arguments.of("neutral English", NEUTRAL_ENGLISH_TEXT, "en", "neutral", NEUTRAL_ENGLISH_TEXT_LIST),
            Arguments.of("empty (no biased words) English", EMPTY_ENGLISH_TEXT, "en", "empty", null),
            Arguments.of("non-inclusive German", NON_INCLUSIVE_GERMAN_TEXT, "de", "non-inclusive-coded", NON_INCLUSIVE_GERMAN_TEXT_LIST),
            Arguments.of("inclusive German", INCLUSIVE_GERMAN_TEXT, "de", "inclusive-coded", INCLUSIVE_GERMAN_TEXT_LIST),
            Arguments.of("neutral German", NEUTRAL_GERMAN_TEXT, "de", "neutral", NEUTRAL_GERMAN_TEXT_LIST),
            Arguments.of("empty (no biased words) German", EMPTY_GERMAN_TEXT, "de", "empty", null),
            Arguments.of("special characters English", SPECIAL_CHARACTER_TEXT, "en", "non-inclusive-coded", SPECIAL_CHARACTER_LIST)
        );
    }

    @Nested
    class AnalyzeHtmlContent {

        @Test
        void shouldStripHtmlTagsBeforeAnalysis() {
            List<BiasedIssues> response = analyzeHtml(HTML_TEXT, "en");

            assertGenderBiasAnalysisResponse(response, "en", "non-inclusive-coded", HTML_LIST);
        }

        @Test
        void shouldHandleGermanHtmlContent() {
            List<BiasedIssues> response = analyzeHtml("<p>" + NON_INCLUSIVE_GERMAN_TEXT + "</p>", "de");

            assertGenderBiasAnalysisResponse(response, "de", "non-inclusive-coded", NON_INCLUSIVE_GERMAN_TEXT_LIST);
        }
    }

    @Nested
    class Authorization {

        @ParameterizedTest(name = "should return 401 for unauthenticated request to {0}")
        @ValueSource(strings = { "/analyze", "/analyze-html" })
        void shouldReturn401ForUnauthenticatedRequest(String endpoint) {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            Void result = api.withoutPostProcessors().postAndRead(BASE_URL + endpoint, request, Void.class, 401);

            assertThat(result).isNull();
        }

        @ParameterizedTest(name = "should return 403 for non-professor role on {0}")
        @ValueSource(strings = { "/analyze", "/analyze-html" })
        void shouldReturn403ForNonProfessorRole(String endpoint) {
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository, userRepository);
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            Void result = api
                .with(JwtPostProcessors.jwtUser(applicant.getUser().getUserId(), "ROLE_APPLICANT"))
                .postAndRead(BASE_URL + endpoint, request, Void.class, 403);

            assertThat(result).isNull();
        }
    }

    @Nested
    class EdgeCases {

        @Test
        void shouldHandleEmptyTexts() {
            List<BiasedIssues> response = analyzeText("", "en");
            assertGenderBiasAnalysisResponse(response, "en", "empty", null);
        }

        @Test
        void shouldHandleNullTexts() {
            List<BiasedIssues> response = analyzeText(null, "en");
            assertGenderBiasAnalysisResponse(response, "en", "empty", null);
        }

        @Test
        void shouldDefaultToEnglishWhenLanguageIsEmpty() {
            List<BiasedIssues> response = analyzeText(NON_INCLUSIVE_ENGLISH_TEXT, "");
            assertThat(response).allSatisfy(issue -> assertThat(issue.getLanguage()).isEqualTo("en"));
            List<BiasedIssues> responseHtml = analyzeHtml(NON_INCLUSIVE_ENGLISH_TEXT, "");
            assertThat(responseHtml).allSatisfy(issue -> assertThat(issue.getLanguage()).isEqualTo("en"));
        }

        @Test
        void shouldHandleHyphenedWords() {
            List<BiasedIssues> response = analyzeText(HYPHENED_TEXT, "en");
            assertGenderBiasAnalysisResponse(response, "en", "inclusive-coded", HYPHENED_TEXT_LIST);
        }

        @Test
        void shouldHandleVeryLongText() {
            StringBuilder longText = new StringBuilder();
            for (int i = 0; i < 1000; i++) {
                longText.append("competitive analytical decisive leader ");
            }

            List<BiasedIssues> response = analyzeText(longText.toString(), "en");

            assertThat(response)
                .hasSize(4000)
                .allSatisfy(issue -> {
                    assertThat(issue.getLanguage()).isEqualTo("en");
                    assertThat(issue.getCoding()).isEqualTo("non-inclusive-coded");
                });
        }

        @Test
        void shouldHandleMixedCaseWords() {
            String mixedCaseText = "The candidate should be COMPETITIVE and Analytical";

            List<BiasedIssues> response = analyzeText(mixedCaseText, "en");

            List<ExpectedBiasedIssue> expectedBiasedWords = List.of(
                new ExpectedBiasedIssue("competitive", GenderCategory.NON_INCLUSIVE),
                new ExpectedBiasedIssue("analytical", GenderCategory.NON_INCLUSIVE)
            );

            assertGenderBiasAnalysisResponse(response, "en", "non-inclusive-coded", expectedBiasedWords);
        }

        @Test
        void shouldHandleRepeatedWords() {
            String repeatedText = "competitive competitive competitive competitive";

            List<BiasedIssues> response = analyzeText(repeatedText, "en");

            assertThat(response)
                .hasSize(4)
                .allSatisfy(issue -> assertThat(issue.getCoding()).isEqualTo("non-inclusive-coded"));
        }
    }
}
