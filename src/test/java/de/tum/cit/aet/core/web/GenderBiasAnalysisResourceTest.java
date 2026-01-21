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

    @Nested
    class AnalyzeText {

        @Test
        void shouldDetectNonInclusiveCodedEnglishText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "non-inclusive-coded", NON_INCLUSIVE_ENGLISH_TEXT_LIST);
        }

        @Test
        void shouldDetectInclusiveCodedEnglishText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(INCLUSIVE_ENGLISH_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "inclusive-coded", INCLUSIVE_ENGLISH_TEXT_LIST);
        }

        @Test
        void shouldDetectNeutralEnglishText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NEUTRAL_ENGLISH_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "neutral", NEUTRAL_ENGLISH_TEXT_LIST);
        }

        @Test
        void shouldDetectEmptyEnglishText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(EMPTY_ENGLISH_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "empty", null);
        }

        @Test
        void shouldDetectNonInclusiveCodedGermanText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_GERMAN_TEXT, "de");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "de", "non-inclusive-coded", NON_INCLUSIVE_GERMAN_TEXT_LIST);
        }

        @Test
        void shouldDetectInclusiveCodedGermanText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(INCLUSIVE_GERMAN_TEXT, "de");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "de", "inclusive-coded", INCLUSIVE_GERMAN_TEXT_LIST);
        }

        @Test
        void shouldDetectNeutralGermanText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NEUTRAL_GERMAN_TEXT, "de");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "de", "neutral", NEUTRAL_GERMAN_TEXT_LIST);
        }

        @Test
        void shouldDetectEmptyGermanText() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(EMPTY_GERMAN_TEXT, "de");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "de", "empty", null);
        }

        @Test
        void shouldHandleTextWithSpecialCharacters() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(SPECIAL_CHARACTER_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "non-inclusive-coded", SPECIAL_CHARACTER_LIST);
        }

        @Test
        void shouldDefaultToEnglishWhenNoLanguageSpecified() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, null);

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertThat(response.language()).isEqualTo("en");
        }
    }

    @Nested
    class AnalyzeHtmlContent {

        @Test
        void shouldStripHtmlTagsBeforeAnalysis() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(HTML_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze-html", request, GenderBiasAnalysisResponse.class, 200);

            String strippedText = Jsoup.parse(request.text()).text();

            assertGenderBiasAnalysisResponse(response, strippedText, "en", "non-inclusive-coded", HTML_LIST);
        }

        @Test
        void shouldHandleGermanHtmlContent() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest("<p>" + NON_INCLUSIVE_GERMAN_TEXT + "</p>", "de");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze-html", request, GenderBiasAnalysisResponse.class, 200);

            String strippedText = Jsoup.parse(request.text()).text();

            assertGenderBiasAnalysisResponse(response, strippedText, "de", "non-inclusive-coded", NON_INCLUSIVE_GERMAN_TEXT_LIST);
        }

        @Test
        void shouldDefaultToEnglishForHtmlWhenNoLanguageSpecified() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(HTML_TEXT, null);

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze-html", request, GenderBiasAnalysisResponse.class, 200);

            assertThat(response.language()).isEqualTo("en");
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
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest("", "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, null, "en", "empty", null);
        }

        @Test
        void shouldHandleNullTexts() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(null, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, null, "en", "empty", null);
        }

        @Test
        void shouldDefaultToEnglishWhenLanguageIsEmpty() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(NON_INCLUSIVE_ENGLISH_TEXT, "");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertThat(response.language()).isEqualTo("en");
        }

        @Test
        void shouldHandleHyphenedWords() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(HYPHENED_TEXT, "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "inclusive-coded", HYPHENED_TEXT_LIST);
        }

        @Test
        void shouldHandleVeryLongText() {
            StringBuilder longText = new StringBuilder();
            for (int i = 0; i < 1000; i++) {
                longText.append("competitive analytical decisive leader ");
            }
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest(longText.toString(), "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertThat(response.originalText()).isEqualTo(longText.toString());
            assertThat(response.language()).isEqualTo("en");
            assertThat(response.coding()).isEqualTo("non-inclusive-coded");
            assertThat(response.biasedWords()).hasSize(4000);
        }

        @Test
        void shouldHandleMixedCaseWords() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest("The candidate should be COMPETITIVE and Analytical", "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            List<BiasedWordDTO> expectedBiasedWords = List.of(
                new BiasedWordDTO("competitive", "non-inclusive"),
                new BiasedWordDTO("analytical", "non-inclusive")
            );

            assertGenderBiasAnalysisResponse(response, request.text(), "en", "non-inclusive-coded", expectedBiasedWords);
        }

        @Test
        void shouldHandleRepeatedWords() {
            GenderBiasAnalysisRequest request = new GenderBiasAnalysisRequest("competitive competitive competitive competitive", "en");

            GenderBiasAnalysisResponse response = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(BASE_URL + "/analyze", request, GenderBiasAnalysisResponse.class, 200);

            assertThat(response.coding()).isEqualTo("non-inclusive-coded");
            assertThat(response.biasedWords()).hasSize(4);
        }
    }
}
