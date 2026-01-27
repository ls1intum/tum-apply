package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.itextpdf.styledxmlparser.jsoup.Jsoup;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisRequest;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GenderBiasAnalysisResourceTest extends AbstractResourceTest {

    private static final String BASE_URL = "/api/gender-bias";

    /* English Texts */
    private static final String NON_INCLUSIVE_ENGLISH_TEXT = "The candidate should be a strong leader with competitive skills.";
    private static final List<BiasedWordDTO> NON_INCLUSIVE_ENGLISH_TEXT_LIST = List.of(
        new BiasedWordDTO("leader", "non-inclusive"),
        new BiasedWordDTO("competitive", "non-inclusive")
    );
    private static final String INCLUSIVE_ENGLISH_TEXT = "The candidate should be supportive, collaborative, and understanding.";
    private static final List<BiasedWordDTO> INCLUSIVE_ENGLISH_TEXT_LIST = List.of(
        new BiasedWordDTO("supportive", "inclusive"),
        new BiasedWordDTO("collaborative", "inclusive"),
        new BiasedWordDTO("understanding", "inclusive")
    );
    private static final String NEUTRAL_ENGLISH_TEXT =
        "The candidate should be a strong leader and decisive, but also supportive and collaborative.";
    private static final List<BiasedWordDTO> NEUTRAL_ENGLISH_TEXT_LIST = List.of(
        new BiasedWordDTO("leader", "non-inclusive"),
        new BiasedWordDTO("decisive", "non-inclusive"),
        new BiasedWordDTO("supportive", "inclusive"),
        new BiasedWordDTO("collaborative", "inclusive")
    );
    private static final String EMPTY_ENGLISH_TEXT = "The candidate should be very nice.";

    /* German Texts */
    private static final String NON_INCLUSIVE_GERMAN_TEXT = "Wir suchen eine durchsetzungsfähige Person mit analytischen Fähigkeiten.";
    private static final List<BiasedWordDTO> NON_INCLUSIVE_GERMAN_TEXT_LIST = List.of(
        new BiasedWordDTO("durchsetzungsfähige", "non-inclusive"),
        new BiasedWordDTO("analytischen", "non-inclusive")
    );
    private static final String INCLUSIVE_GERMAN_TEXT = "Die Person sollte kooperativ, einfühlsam und verständnisvoll sein.";
    private static final List<BiasedWordDTO> INCLUSIVE_GERMAN_TEXT_LIST = List.of(
        new BiasedWordDTO("kooperativ", "inclusive"),
        new BiasedWordDTO("einfühlsam", "inclusive"),
        new BiasedWordDTO("verständnisvoll", "inclusive")
    );
    private static final String NEUTRAL_GERMAN_TEXT =
        "Die Person sollte durchsetzungsfähig und ehrgeizig sein, aber auch einfühlsam und verständnisvoll.";
    private static final List<BiasedWordDTO> NEUTRAL_GERMAN_TEXT_LIST = List.of(
        new BiasedWordDTO("durchsetzungsfähig", "non-inclusive"),
        new BiasedWordDTO("ehrgeizig", "non-inclusive"),
        new BiasedWordDTO("einfühlsam", "inclusive"),
        new BiasedWordDTO("verständnisvoll", "inclusive")
    );
    private static final String EMPTY_GERMAN_TEXT = "Die Person sollte sich gut einbringen können.";

    /* Special Texts */
    private static final String SPECIAL_CHARACTER_TEXT = "The candidate should be: competitive & analytical @ wörk;";
    private static final List<BiasedWordDTO> SPECIAL_CHARACTER_LIST = List.of(
        new BiasedWordDTO("competitive", "non-inclusive"),
        new BiasedWordDTO("analytical", "non-inclusive")
    );
    private static final String HTML_TEXT = "<html><body><h1>Job Description</h1><p>We need a <b>decisive</b> leader</p></body></html>";
    private static final List<BiasedWordDTO> HTML_LIST = List.of(
        new BiasedWordDTO("decisive", "non-inclusive"),
        new BiasedWordDTO("leader", "non-inclusive")
    );
    private static final String HYPHENED_TEXT = "The candidate should be supportive, co-operativ, and understanding with a high-quality.";
    private static final List<BiasedWordDTO> HYPHENED_TEXT_LIST = List.of(
        new BiasedWordDTO("supportive", "inclusive"),
        new BiasedWordDTO("co-operativ", "inclusive"),
        new BiasedWordDTO("understanding", "inclusive")
    );

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
        GenderBiasAnalysisResponse response,
        String expectedText,
        String expectedLanguage,
        String expectedCoding,
        List<BiasedWordDTO> expectedBiasedWords
    ) {
        assertThat(response.originalText()).isEqualTo(expectedText);
        assertThat(response.language()).isEqualTo(expectedLanguage);
        assertThat(response.coding()).isEqualTo((expectedCoding));
        assertThat(response.biasedWords()).isEqualTo(expectedBiasedWords);
    }

    private GenderBiasAnalysisResponse analyzeText(String text, String language) {
        GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(text, language);
        return api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);
    }

    private GenderBiasAnalysisResponse analyzeHtml(String html, String language) {
        GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(html, language);
        return api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(BASE_URL + "/analyze-html", request, GenderBiasAnalysisResponse.class, 200);
    }

    @Nested
    class AnalyzeText {

        @Test
        void shouldDetectNonInclusiveCodedEnglishText() {
            GenderBiasAnalysisResponse response = analyzeText(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            assertGenderBiasAnalysisResponse(
                response,
                NON_INCLUSIVE_ENGLISH_TEXT,
                "en",
                "non-inclusive-coded",
                NON_INCLUSIVE_ENGLISH_TEXT_LIST
            );
        }

        @Test
        void shouldDetectInclusiveCodedEnglishText() {
            GenderBiasAnalysisResponse response = analyzeText(INCLUSIVE_ENGLISH_TEXT, "en");

            assertGenderBiasAnalysisResponse(response, INCLUSIVE_ENGLISH_TEXT, "en", "inclusive-coded", INCLUSIVE_ENGLISH_TEXT_LIST);
        }

        @Test
        void shouldDetectNeutralEnglishText() {
            GenderBiasAnalysisResponse response = analyzeText(NEUTRAL_ENGLISH_TEXT, "en");

            assertGenderBiasAnalysisResponse(response, NEUTRAL_ENGLISH_TEXT, "en", "neutral", NEUTRAL_ENGLISH_TEXT_LIST);
        }

        @Test
        void shouldDetectEmptyEnglishText() {
            GenderBiasAnalysisResponse response = analyzeText(EMPTY_ENGLISH_TEXT, "en");

            assertGenderBiasAnalysisResponse(response, EMPTY_ENGLISH_TEXT, "en", "empty", null);
        }

        @Test
        void shouldDetectNonInclusiveCodedGermanText() {
            GenderBiasAnalysisResponse response = analyzeText(NON_INCLUSIVE_GERMAN_TEXT, "de");

            assertGenderBiasAnalysisResponse(
                response,
                NON_INCLUSIVE_GERMAN_TEXT,
                "de",
                "non-inclusive-coded",
                NON_INCLUSIVE_GERMAN_TEXT_LIST
            );
        }

        @Test
        void shouldDetectInclusiveCodedGermanText() {
            GenderBiasAnalysisResponse response = analyzeText(INCLUSIVE_GERMAN_TEXT, "de");

            assertGenderBiasAnalysisResponse(response, INCLUSIVE_GERMAN_TEXT, "de", "inclusive-coded", INCLUSIVE_GERMAN_TEXT_LIST);
        }

        @Test
        void shouldDetectNeutralGermanText() {
            GenderBiasAnalysisResponse response = analyzeText(NEUTRAL_GERMAN_TEXT, "de");

            assertGenderBiasAnalysisResponse(response, NEUTRAL_GERMAN_TEXT, "de", "neutral", NEUTRAL_GERMAN_TEXT_LIST);
        }

        @Test
        void shouldDetectEmptyGermanText() {
            GenderBiasAnalysisResponse response = analyzeText(EMPTY_GERMAN_TEXT, "de");

            assertGenderBiasAnalysisResponse(response, EMPTY_GERMAN_TEXT, "de", "empty", null);
        }

        @Test
        void shouldHandleTextWithSpecialCharacters() {
            GenderBiasAnalysisResponse response = analyzeText(SPECIAL_CHARACTER_TEXT, "en");

            assertGenderBiasAnalysisResponse(response, SPECIAL_CHARACTER_TEXT, "en", "non-inclusive-coded", SPECIAL_CHARACTER_LIST);
        }
    }

    @Nested
    class AnalyzeHtmlContent {

        @Test
        void shouldStripHtmlTagsBeforeAnalysis() {
            GenderBiasAnalysisResponse response = analyzeHtml(HTML_TEXT, "en");

            String strippedText = Jsoup.parse(HTML_TEXT).text();

            assertGenderBiasAnalysisResponse(response, strippedText, "en", "non-inclusive-coded", HTML_LIST);
        }

        @Test
        void shouldHandleGermanHtmlContent() {
            GenderBiasAnalysisResponse response = analyzeHtml("<p>" + NON_INCLUSIVE_GERMAN_TEXT + "</p>", "de");

            String strippedText = Jsoup.parse("<p>" + NON_INCLUSIVE_GERMAN_TEXT + "</p>").text();

            assertGenderBiasAnalysisResponse(response, strippedText, "de", "non-inclusive-coded", NON_INCLUSIVE_GERMAN_TEXT_LIST);
        }
    }

    @Nested
    class Authorization {

        @Test
        void analyzeTextWithoutAuthenticationReturns401() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            Void result = api.withoutPostProcessors().postAndRead(BASE_URL + "/analyze", request, Void.class, 401);

            assertThat(result).isNull();
        }

        @Test
        void analyzeHtmlWithoutAuthenticationReturns401() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(HTML_TEXT, "en");

            Void result = api.withoutPostProcessors().postAndRead(BASE_URL + "/analyze-html", request, Void.class, 401);

            assertThat(result).isNull();
        }

        @Test
        void analyzeTextWithNonProfessorRoleReturns403() {
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            Void result = api
                .with(JwtPostProcessors.jwtUser(applicant.getUser().getUserId(), "ROLE_APPLICANT"))
                .postAndRead(BASE_URL + "/analyze", request, Void.class, 403);

            assertThat(result).isNull();
        }

        @Test
        void analyzeHtmlWithNonProfessorRoleReturns403() {
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            Void result = api
                .with(JwtPostProcessors.jwtUser(applicant.getUser().getUserId(), "ROLE_APPLICANT"))
                .postAndRead(BASE_URL + "/analyze-html", request, Void.class, 403);

            assertThat(result).isNull();
        }
    }

    @Nested
    class EdgeCases {

        @Test
        void shouldHandleEmptyTexts() {
            GenderBiasAnalysisResponse response = analyzeText("", "en");
            assertGenderBiasAnalysisResponse(response, null, "en", "empty", null);
        }

        @Test
        void shouldHandleNullTexts() {
            GenderBiasAnalysisResponse response = analyzeText(null, "en");
            assertGenderBiasAnalysisResponse(response, null, "en", "empty", null);
        }

        @Test
        void shouldDefaultToEnglishWhenLanguageIsEmpty() {
            GenderBiasAnalysisResponse response = analyzeText(NON_INCLUSIVE_ENGLISH_TEXT, "");
            assertThat(response.language()).isEqualTo("en");
            GenderBiasAnalysisResponse responseHtml = analyzeHtml(NON_INCLUSIVE_ENGLISH_TEXT, "");
            assertThat(responseHtml.language()).isEqualTo("en");
        }

        @Test
        void shouldHandleHyphenedWords() {
            GenderBiasAnalysisResponse response = analyzeText(HYPHENED_TEXT, "en");
            assertGenderBiasAnalysisResponse(response, HYPHENED_TEXT, "en", "inclusive-coded", HYPHENED_TEXT_LIST);
        }

        @Test
        void shouldHandleVeryLongText() {
            StringBuilder longText = new StringBuilder();
            for (int i = 0; i < 1000; i++) {
                longText.append("competitive analytical decisive leader ");
            }

            GenderBiasAnalysisResponse response = analyzeText(longText.toString(), "en");

            assertThat(response.originalText()).isEqualTo(longText.toString());
            assertThat(response.language()).isEqualTo("en");
            assertThat(response.coding()).isEqualTo("non-inclusive-coded");
            assertThat(response.biasedWords()).hasSize(4000);
        }

        @Test
        void shouldHandleMixedCaseWords() {
            String mixedCaseText = "The candidate should be COMPETITIVE and Analytical";

            GenderBiasAnalysisResponse response = analyzeText(mixedCaseText, "en");

            List<BiasedWordDTO> expectedBiasedWords = List.of(
                new BiasedWordDTO("competitive", "non-inclusive"),
                new BiasedWordDTO("analytical", "non-inclusive")
            );

            assertGenderBiasAnalysisResponse(response, mixedCaseText, "en", "non-inclusive-coded", expectedBiasedWords);
        }

        @Test
        void shouldHandleRepeatedWords() {
            String repeatedText = "competitive competitive competitive competitive";

            GenderBiasAnalysisResponse response = analyzeText(repeatedText, "en");

            assertThat(response.coding()).isEqualTo("non-inclusive-coded");
            assertThat(response.biasedWords()).hasSize(4);
        }
    }
}
