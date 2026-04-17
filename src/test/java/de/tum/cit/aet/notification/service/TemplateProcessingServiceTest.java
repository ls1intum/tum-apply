package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.dto.JobPublicationEmailContextDTO;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.utility.testdata.JobTestData;
import freemarker.core.TemplateClassResolver;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.io.StringWriter;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TemplateProcessingServiceTest {

    private static final String BASE_TEMPLATE = "base/raw.ftl";
    private static final String BASE_URL = "http://localhost";

    private Configuration freemarkerConfig;
    private TemplateProcessingService service;

    @BeforeEach
    void setUp() {
        freemarkerConfig = spy(new Configuration(Configuration.VERSION_2_3_32));
        freemarkerConfig.setClassLoaderForTemplateLoading(getClass().getClassLoader(), "/templates");
        service = new TemplateProcessingService(freemarkerConfig);
        // Hardening is applied in the constructor, no separate call needed
        ReflectionTestUtils.setField(service, "url", BASE_URL);
    }

    @Nested
    class RenderSubjectTests {

        @Test
        void addsPrefixWhenTranslationGiven() {
            EmailTemplateTranslation translation = new EmailTemplateTranslation();
            translation.setSubject("Welcome");
            assertThat(service.renderSubject(translation, null)).isEqualTo("TUMApply - Welcome");
        }

        @Test
        void handlesNullContentWhenTranslationGiven() {
            EmailTemplateTranslation translation = new EmailTemplateTranslation();
            translation.setSubject("Welcome");
            assertThat(service.renderSubject(translation, null)).isEqualTo("TUMApply - Welcome");
        }
    }

    @Nested
    class RenderTemplateTests {

        @Test
        void withApplicationWrapsLayoutAndReplacesVariables() throws Exception {
            EmailTemplateTranslation translation = translation("${APPLICANT_FIRST_NAME}", Language.ENGLISH, "app");
            Template layout = mockTemplate("${bodyHtml} ${url}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            String result = service.renderTemplate(translation, mockApplication());

            assertThat(result).contains(BASE_URL, "Alice");
        }

        @Test
        void withJobInjectsJobVariables() throws Exception {
            EmailTemplateTranslation translation = translation("${JOB_TITLE}", Language.ENGLISH, "job");
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            String result = service.renderTemplate(translation, mockApplication().getJob());

            assertThat(result).contains("JobTitle");
        }

        @Test
        void withJobPublicationContextInjectsApplicantAndJobVariables() throws Exception {
            EmailTemplateTranslation translation = translation(
                "${APPLICANT_FIRST_NAME} ${APPLICANT_LAST_NAME} ${JOB_TITLE} ${SUBJECT_AREA} ${RESEARCH_GROUP_NAME} " +
                    "${SUPERVISING_PROFESSOR_FIRST_NAME} ${SUPERVISING_PROFESSOR_LAST_NAME} ${JOB_ID} ${url}",
                Language.ENGLISH,
                "jobPublication"
            );
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            String result = service.renderTemplate(translation, mockJobPublicationContext());

            assertThat(result).contains(
                "Alice",
                "Smith",
                "JobTitle",
                SubjectArea.BIOCHEMISTRY.getEnglishValue(),
                "RG",
                "John",
                "Doe",
                BASE_URL,
                "123e4567-e89b-12d3-a456-426614174000"
            );
        }

        @Test
        void withResearchGroupInjectsGroupName() throws Exception {
            EmailTemplateTranslation translation = translation("${RESEARCH_GROUP_NAME}", Language.ENGLISH, "group");
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            ResearchGroup group = mock(ResearchGroup.class);
            when(group.getName()).thenReturn("RG");

            String result = service.renderTemplate(translation, group);

            assertThat(result).contains("RG");
        }

        @Test
        void withUserInjectsCodeBackedLinks() throws Exception {
            EmailTemplateTranslation translation = translation(
                "${LOGIN_LINK} ${APPLICATIONS_LINK} ${DOCUMENTATION_LINK}",
                Language.ENGLISH,
                "user"
            );
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            User user = mock(User.class);
            when(user.getFirstName()).thenReturn("Alice");
            when(user.getLastName()).thenReturn("Smith");

            String result = service.renderTemplate(translation, user);

            assertThat(result).contains(BASE_URL, BASE_URL + "/application/overview", "https://ls1intum.github.io/tum-apply/");
        }

        @Test
        void withCtaMacroRendersSharedButtonMarkup() throws Exception {
            EmailTemplateTranslation translation = translation(
                "<@ui.ctaButton href=(APPLICATION_LINK!'') label=\"View Application\" />",
                Language.ENGLISH,
                "cta"
            );
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            String result = service.renderTemplate(translation, mockApplication());

            assertThat(result)
                .contains("View Application")
                .contains("background-color: #3070b3")
                .contains("href=\"http://localhost/evaluation/application");
        }

        @Test
        void withInterviewSlotInjectsSlotAndJobVariables() throws Exception {
            // Arrange
            EmailTemplateTranslation translation = translation("${INTERVIEW_LOCATION} - ${JOB_TITLE}", Language.ENGLISH, "interview");
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            Job job = JobTestData.newJob(null, null, "JobTitle", null, null);
            job.setSupervisingProfessor(mock(User.class));
            job.setResearchGroup(mock(ResearchGroup.class));

            InterviewProcess process = new InterviewProcess();
            process.setJob(job);

            InterviewSlot slot = new InterviewSlot();
            slot.setInterviewProcess(process);
            slot.setStartDateTime(Instant.now());
            slot.setEndDateTime(Instant.now().plus(1, ChronoUnit.HOURS));
            slot.setLocation("Room 101");

            // Act
            String result = service.renderTemplate(translation, slot);

            // Assert
            assertThat(result).contains("Room 101", "JobTitle");
        }

        @Test
        void fallsBackToInlineTemplateWhenTemplateNameIsNull() throws Exception {
            EmailTemplateTranslation translation = translation("InlineBody", null);
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            ResearchGroup group = mock(ResearchGroup.class);
            when(group.getName()).thenReturn("RG");

            String result = service.renderTemplate(translation, group);

            assertThat(result).contains("InlineBody");
        }

        @Test
        void throwsTemplateProcessingExceptionWhenLayoutCannotBeLoaded() throws Exception {
            EmailTemplateTranslation translation = translation("Body", Language.ENGLISH, "broken");
            doThrow(new IOException("fail")).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            assertThatThrownBy(() -> service.renderTemplate(translation, mockApplication()))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to load raw FreeMarker template");
        }

        @Test
        void throwsTemplateProcessingExceptionWhenInlineTemplateIsInvalid() {
            EmailTemplateTranslation translation = translation("${unclosed", "fail");
            ResearchGroup group = mock(ResearchGroup.class);
            when(group.getName()).thenReturn("RG");

            assertThatThrownBy(() -> service.renderTemplate(translation, group))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to process inline FreeMarker template");
        }

        @Test
        void throwsForUnsupportedContentType() throws Exception {
            EmailTemplateTranslation translation = translation("Body", Language.ENGLISH, "unsupported");
            Template layout = mockTemplate("X ${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            assertThatThrownBy(() -> service.renderTemplate(translation, 123))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Unsupported content type");
        }

        @Test
        void throwsNpeWhenTranslationIsNull() {
            ResearchGroup group = mock(ResearchGroup.class);
            assertThatThrownBy(() -> service.renderTemplate(null, group)).isInstanceOf(NullPointerException.class);
        }

        @Test
        void throwsNpeWhenContentIsNull() {
            EmailTemplateTranslation translation = translation("Body", "group");
            assertThatThrownBy(() -> service.renderTemplate(translation, null)).isInstanceOf(NullPointerException.class);
        }
    }

    @Nested
    class RenderRawTemplateTests {

        @Test
        void sanitizesHtmlContent() throws Exception {
            Template layout = mockTemplate("Safe ${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            String result = service.renderRawTemplate(Language.ENGLISH, "<script>bad</script>");
            assertThat(result).contains("Safe").doesNotContain("<script>");
        }

        @Test
        void throwsTemplateProcessingExceptionWhenLayoutMissing() throws Exception {
            doThrow(new IOException("missing")).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            assertThatThrownBy(() -> service.renderRawTemplate(Language.ENGLISH, "<p>Hi</p>"))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to load raw FreeMarker template");
        }

        @Test
        void throwsNpeWhenLanguageIsNull() {
            assertThatThrownBy(() -> service.renderRawTemplate(null, "<p>hi</p>")).isInstanceOf(NullPointerException.class);
        }
    }

    @Nested
    class SSTIProtectionTests {

        @Test
        void rejectsNewBuiltinInTemplateBody() throws Exception {
            // This is the classic FreeMarker SSTI payload that would execute arbitrary commands
            String maliciousBody = "${'freemarker.template.utility.Execute'?new()('id')}";
            EmailTemplateTranslation translation = translation(maliciousBody, Language.ENGLISH, "ssti");
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            ResearchGroup group = mock(ResearchGroup.class);
            when(group.getName()).thenReturn("RG");

            assertThatThrownBy(() -> service.renderTemplate(translation, group))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to render FreeMarker template");
        }

        @Test
        void rejectsNewBuiltinInSubject() {
            String maliciousSubject = "${'freemarker.template.utility.Execute'?new()('id')}";
            ResearchGroup group = mock(ResearchGroup.class);
            when(group.getName()).thenReturn("RG");

            assertThatThrownBy(() -> service.renderSubject(maliciousSubject, group))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to render FreeMarker template");
        }

        @Test
        void rejectsObjectConstructorInTemplate() throws Exception {
            String maliciousBody = "${'freemarker.template.utility.ObjectConstructor'?new()}";
            EmailTemplateTranslation translation = translation(maliciousBody, Language.ENGLISH, "ssti2");
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            ResearchGroup group = mock(ResearchGroup.class);
            when(group.getName()).thenReturn("RG");

            assertThatThrownBy(() -> service.renderTemplate(translation, group))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to render FreeMarker template");
        }

        @Test
        void allowsNormalTemplateVariablesAfterHardening() throws Exception {
            EmailTemplateTranslation translation = translation("Hello ${APPLICANT_FIRST_NAME}", Language.ENGLISH, "safe");
            Template layout = mockTemplate("${bodyHtml}");
            doReturn(layout).when(freemarkerConfig).getTemplate(BASE_TEMPLATE);

            String result = service.renderTemplate(translation, mockApplication());
            assertThat(result).contains("Hello Alice");
            assertThat(result).doesNotContain("${APPLICANT_FIRST_NAME}");
        }

        @Test
        void hardeningIsAppliedInConstructor() {
            // Verify the Configuration was hardened during construction by checking
            // that setNewBuiltinClassResolver was called with ALLOWS_NOTHING_RESOLVER
            verify(freemarkerConfig).setNewBuiltinClassResolver(TemplateClassResolver.ALLOWS_NOTHING_RESOLVER);
        }
    }

    @Nested
    class RenderMethodTests {

        @Test
        void throwsTemplateProcessingExceptionWhenTemplateProcessingFails() throws Exception {
            Template template = mock(Template.class);
            when(template.getName()).thenReturn("broken");
            doThrow(new TemplateException("broken", (Throwable) null, null)).when(template).process(anyMap(), any(StringWriter.class));

            assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(service, "render", template, Map.of()))
                .isInstanceOf(TemplateProcessingException.class)
                .hasMessageContaining("Failed to render FreeMarker template");
        }
    }

    // --- Helpers ---

    private EmailTemplateTranslation translation(String body, Language lang, String name) {
        EmailTemplateTranslation tr = new EmailTemplateTranslation();
        tr.setBodyHtml(body);
        tr.setLanguage(lang);
        tr.setEmailTemplate(new EmailTemplate());
        tr.getEmailTemplate().setTemplateName(name);
        return tr;
    }

    private EmailTemplateTranslation translation(String body, String templateName) {
        return translation(body, Language.ENGLISH, templateName);
    }

    private Template mockTemplate(String expectedOutput) throws Exception {
        Template t = mock(Template.class);
        when(t.getName()).thenReturn("mock");
        doAnswer(invocation -> {
            Map<String, Object> model = invocation.getArgument(0);
            StringWriter writer = invocation.getArgument(1);
            String body = expectedOutput;
            for (Map.Entry<String, Object> e : model.entrySet()) {
                body = body.replace("${" + e.getKey() + "}", String.valueOf(e.getValue()));
            }
            writer.write(body);
            return null;
        })
            .when(t)
            .process(anyMap(), any(StringWriter.class));
        return t;
    }

    private Application mockApplication() {
        User applicantUser = new User();
        applicantUser.setFirstName("Alice");
        applicantUser.setLastName("Smith");

        Applicant applicant = new Applicant();
        applicant.setUser(applicantUser);

        ResearchGroup group = new ResearchGroup();
        group.setName("RG");

        User professor = new User();
        professor.setFirstName("John");
        professor.setLastName("Doe");

        Job job = new Job();
        job.setTitle("JobTitle");
        job.setSubjectArea(SubjectArea.BIOCHEMISTRY);
        job.setSupervisingProfessor(professor);
        job.setResearchGroup(group);

        Application app = new Application();
        app.setApplicant(applicant);
        app.setJob(job);
        return app;
    }

    private JobPublicationEmailContextDTO mockJobPublicationContext() {
        Application application = mockApplication();
        application.getJob().setJobId(UUID.fromString("123e4567-e89b-12d3-a456-426614174000"));
        return JobPublicationEmailContextDTO.fromEntities(application.getApplicant().getUser(), application.getJob());
    }
}
