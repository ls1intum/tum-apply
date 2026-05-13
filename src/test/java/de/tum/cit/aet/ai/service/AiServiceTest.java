package de.tum.cit.aet.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import de.tum.cit.aet.ai.domain.BiasedIssue;
import de.tum.cit.aet.ai.domain.ComplianceIssue;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.constants.GenderCategory;
import de.tum.cit.aet.core.documents.service.DocumentService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.ai.chat.client.ChatClient;

class AiServiceTest {

    private static final UUID JOB_ID = UUID.fromString("00000000-0000-0000-0000-000000000444");
    private static final UUID SUPERVISING_PROFESSOR_ID = UUID.fromString("00000000-0000-0000-0000-000000000333");

    private JobService jobService;
    private GenderBiasAnalysisService genderBiasAnalysisService;
    private ComplianceScoreService complianceScoreService;
    private AiService service;

    @BeforeEach
    void setUp() {
        ChatClient.Builder chatClientBuilder = mock(ChatClient.Builder.class);
        given(chatClientBuilder.build()).willReturn(mock(ChatClient.class));

        jobService = mock(JobService.class);
        genderBiasAnalysisService = mock(GenderBiasAnalysisService.class);
        complianceScoreService = mock(ComplianceScoreService.class);
        AiFeatureToggleService aiFeatureToggleService = mock(AiFeatureToggleService.class);
        given(aiFeatureToggleService.isAiAvailable()).willReturn(false);

        service = new AiService(
            chatClientBuilder,
            jobService,
            mock(ApplicationService.class),
            mock(DocumentService.class),
            mock(CurrentUserService.class),
            genderBiasAnalysisService,
            complianceScoreService,
            aiFeatureToggleService
        );
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("htmlCases")
    void shouldStripHtmlBeforeGenderBiasAnalysis(String label, String html, String language, String expectedPlainText) {
        List<BiasedIssue> genderAnalysis = List.of(new BiasedIssue(language, "leader", GenderCategory.NON_INCLUSIVE));
        given(genderBiasAnalysisService.analyzeText(expectedPlainText, language)).willReturn(genderAnalysis);
        given(complianceScoreService.calculateGenderScore(genderAnalysis, null, expectedPlainText)).willReturn(100);
        given(complianceScoreService.calculateLegalScore(List.of())).willReturn(100);

        List<ComplianceIssue> result = service.analyzeCurrentJobDescription(createJobForm(html, language), language, "en");

        assertThat(result).isEmpty();
        verify(genderBiasAnalysisService).analyzeText(expectedPlainText, language);
        verify(jobService).updateAiAnalysis(JOB_ID, 100, List.of(), genderAnalysis, language);
    }

    static Stream<Arguments> htmlCases() {
        return Stream.of(
            Arguments.of(
                "English HTML",
                "<html><body><h1>Job Description</h1><p>We need a <b>decisive</b> leader</p></body></html>",
                "en",
                "Job Description We need a decisive leader"
            ),
            Arguments.of(
                "German HTML",
                "<p>Wir suchen eine durchsetzungsfähige Person mit analytischen Fähigkeiten.</p>",
                "de",
                "Wir suchen eine durchsetzungsfähige Person mit analytischen Fähigkeiten."
            )
        );
    }

    private JobFormDTO createJobForm(String description, String language) {
        return new JobFormDTO(
            JOB_ID,
            "Research Assistant",
            "AI",
            SubjectArea.COMPUTER_SCIENCE,
            SUPERVISING_PROFESSOR_ID,
            Campus.MUNICH,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "en".equals(language) ? description : null,
            "de".equals(language) ? description : null,
            JobState.DRAFT,
            null,
            true,
            null,
            null,
            null,
            null,
            null
        );
    }
}
