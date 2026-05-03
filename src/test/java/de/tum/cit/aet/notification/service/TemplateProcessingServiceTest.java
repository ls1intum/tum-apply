package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import freemarker.template.Configuration;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class TemplateProcessingServiceTest {

    private TemplateProcessingService service;

    @BeforeEach
    void init() {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_34);
        cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(), "/templates");
        service = new TemplateProcessingService(cfg);
        ReflectionTestUtils.setField(service, "url", "http://localhost:9000");
    }

    // ===== RENDER SUBJECT =====
    @Nested
    class RenderSubjectTests {

        @Test
        void renderSubject_withRawString_substitutesVariables() {
            Application application = sampleApplication("Alice", "Smith");

            String rendered = service.renderSubject("Hello ${APPLICANT_FIRST_NAME}", application);

            assertThat(rendered).isEqualTo("TUMApply - Hello Alice");
        }

        @Test
        void renderSubject_withNullContent_andNoVariables_works() {
            String rendered = service.renderSubject("Static subject", null);

            assertThat(rendered).isEqualTo("TUMApply - Static subject");
        }
    }

    // ===== RENDER TEMPLATE =====
    @Nested
    class RenderTemplateTests {

        @Test
        void renderTemplate_buildsHtmlWithVariableSubstitution() {
            Application application = sampleApplication("Bob", "Smith");
            String body = "<p>Hi ${APPLICANT_FIRST_NAME}</p>";

            String rendered = service.renderTemplate(Language.ENGLISH, body, application);

            assertThat(rendered).contains("Hi Bob");
        }

        @Test
        void renderTemplate_throwsOnUnsupportedContentType() {
            assertThatThrownBy(() -> service.renderTemplate(Language.ENGLISH, "<p>Hi</p>", "unsupported")).isInstanceOf(
                TemplateProcessingException.class
            );
        }
    }

    private Application sampleApplication(String firstName, String lastName) {
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(firstName + "@test.local");

        Applicant applicant = new Applicant();
        applicant.setUser(user);

        Job job = new Job();
        job.setJobId(UUID.randomUUID());
        job.setTitle("Test Job");
        ResearchGroup rg = new ResearchGroup();
        rg.setName("RG");
        job.setResearchGroup(rg);

        User professor = new User();
        professor.setFirstName("Prof");
        professor.setLastName("Smith");
        professor.setEmail("prof@test.local");
        job.setSupervisingProfessor(professor);

        Application app = new Application();
        app.setApplicationId(UUID.randomUUID());
        app.setApplicant(applicant);
        app.setJob(job);
        return app;
    }
}
