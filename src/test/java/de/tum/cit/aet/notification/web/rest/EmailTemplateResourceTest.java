package de.tum.cit.aet.notification.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.dto.EmailTemplateDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateTranslationDTO;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.EmailTemplateTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

public class EmailTemplateResourceTest extends AbstractResourceTest {

    private static final String BASE_URL = "/api/email-templates";

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    EmailTemplateRepository emailTemplateRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    ResearchGroup researchGroup;
    User professor;
    EmailTemplate existingTemplate;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);
        existingTemplate = EmailTemplateTestData.saved(emailTemplateRepository, researchGroup, professor, EmailType.APPLICATION_ACCEPTED);
    }

    private MvcTestClient asProfessor(User user) {
        return api.with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"));
    }

    private String templateUrl(UUID id) {
        return BASE_URL + "/" + id;
    }

    private static Optional<EmailType> firstNonEditableType() {
        return Arrays.stream(EmailType.values())
            .filter(t -> !t.isTemplateEditable())
            .findFirst();
    }

    private EmailTemplateDTO dto(
        UUID id,
        String name,
        EmailType type,
        EmailTemplateTranslationDTO en,
        EmailTemplateTranslationDTO de,
        boolean isDefault
    ) {
        return new EmailTemplateDTO(id, name, type, isDefault, en, de);
    }

    private EmailTemplateTranslationDTO tr(String subject, String bodyHtml) {
        return new EmailTemplateTranslationDTO(subject, bodyHtml);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getTemplatesReturnsPage() {
        PageResponseDTO<EmailTemplateOverviewDTO> page = asProfessor(professor).getAndRead(
            BASE_URL,
            Map.of("pageNumber", "0", "pageSize", "10"),
            new TypeReference<>() {},
            200
        );

        assertThat(page.getContent()).isNotEmpty();
        assertThat(page.getTotalElements()).isGreaterThan(0);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getTemplateReturns200() {
        EmailTemplateDTO dto = asProfessor(professor).getAndRead(
            templateUrl(existingTemplate.getEmailTemplateId()),
            Map.of(),
            EmailTemplateDTO.class,
            200
        );

        assertThat(dto.emailTemplateId()).isEqualTo(existingTemplate.getEmailTemplateId());
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createTemplateReturns201() {
        EmailTemplateDTO payload = dto(
            null,
            "Custom Template",
            EmailType.APPLICATION_ACCEPTED,
            tr("Subject EN", "<p>Body EN</p>"),
            tr("Subject DE", "<p>Body DE</p>"),
            false
        );

        EmailTemplateDTO created = asProfessor(professor).postAndRead(BASE_URL, payload, EmailTemplateDTO.class, 201);

        assertThat(created.templateName()).isEqualTo("Custom Template");
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateTemplateReturns200() {
        EmailTemplateDTO payload = dto(
            existingTemplate.getEmailTemplateId(),
            "Updated Template",
            existingTemplate.getEmailType(),
            tr("Updated Subject EN", "<p>Updated Body EN</p>"),
            tr("Updated Subject DE", "<p>Updated Body DE</p>"),
            false
        );

        EmailTemplateDTO updated = asProfessor(professor).putAndRead(BASE_URL, payload, EmailTemplateDTO.class, 200);

        assertThat(updated.templateName()).isEqualTo("Updated Template");
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void deleteTemplateReturns204() {
        UUID id = existingTemplate.getEmailTemplateId();

        asProfessor(professor).deleteAndRead(templateUrl(id), null, Void.class, 204);

        assertThat(emailTemplateRepository.findById(id)).isEmpty();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getTemplate_nonExistingId_returns404() {
        asProfessor(professor).getAndRead(templateUrl(UUID.randomUUID()), Map.of(), Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createTemplate_withNullTranslations_succeeds() {
        EmailTemplateDTO payload = dto(null, "NoTrans", EmailType.APPLICATION_ACCEPTED, null, null, false);

        EmailTemplateDTO created = asProfessor(professor).postAndRead(BASE_URL, payload, EmailTemplateDTO.class, 201);

        assertThat(created.english()).isNull();
        assertThat(created.german()).isNull();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createTemplate_whenTypeNotMultiple_returns400() {
        EmailTemplateDTO payload = dto(null, "SingleType", EmailType.APPLICATION_REJECTED, tr("s", "<p>b</p>"), null, false);

        asProfessor(professor).postAndRead(BASE_URL, payload, Void.class, 400);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createTemplate_duplicate_returns409() {
        EmailTemplateDTO payload = dto(
            null,
            existingTemplate.getTemplateName(),
            existingTemplate.getEmailType(),
            tr("s", "<p>b</p>"),
            null,
            false
        );

        asProfessor(professor).postAndRead(BASE_URL, payload, Void.class, 409);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateTemplate_createsTranslationWhenMissing() {
        EmailTemplate templateNoTrans = new EmailTemplate();
        templateNoTrans.setResearchGroup(researchGroup);
        templateNoTrans.setCreatedBy(professor);
        templateNoTrans.setEmailType(EmailType.APPLICATION_ACCEPTED);
        templateNoTrans.setTemplateName("NoTransInDB");
        templateNoTrans.setDefault(false);
        emailTemplateRepository.save(templateNoTrans);

        UUID templateId = templateNoTrans.getEmailTemplateId();

        EmailTemplateDTO payload = dto(
            templateId,
            "NoTransInDB",
            EmailType.APPLICATION_ACCEPTED,
            tr("Subject EN", "<p>Body EN</p>"),
            null,
            false
        );

        EmailTemplateDTO updated = asProfessor(professor).putAndRead(BASE_URL, payload, EmailTemplateDTO.class, 200);

        assertThat(updated.english()).isNotNull();
        assertThat(updated.english().subject()).isEqualTo("Subject EN");
        assertThat(updated.german()).isNull();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateTemplate_nonExistingId_returns404() {
        EmailTemplateDTO payload = dto(UUID.randomUUID(), "Nope", EmailType.APPLICATION_ACCEPTED, null, null, false);

        asProfessor(professor).putAndRead(BASE_URL, payload, Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateTemplate_nonEditableType_returns400() {
        Optional<EmailType> nonEditable = firstNonEditableType();
        Assumptions.assumeTrue(nonEditable.isPresent());

        existingTemplate.setEmailType(nonEditable.get());
        emailTemplateRepository.save(existingTemplate);

        EmailTemplateDTO payload = dto(existingTemplate.getEmailTemplateId(), "Try Update", nonEditable.get(), null, null, false);

        asProfessor(professor).putAndRead(BASE_URL, payload, Void.class, 400);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateTemplate_withNullTranslations_succeeds() {
        EmailTemplateDTO payload = dto(
            existingTemplate.getEmailTemplateId(),
            "NoTransUpdate",
            existingTemplate.getEmailType(),
            null,
            null,
            false
        );

        EmailTemplateDTO updated = asProfessor(professor).putAndRead(BASE_URL, payload, EmailTemplateDTO.class, 200);

        assertThat(updated.templateName()).isEqualTo("NoTransUpdate");
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void deleteTemplate_default_returns400() {
        existingTemplate.setDefault(true);
        emailTemplateRepository.save(existingTemplate);

        asProfessor(professor).deleteAndRead(templateUrl(existingTemplate.getEmailTemplateId()), null, Void.class, 400);
    }

    @Test
    void unauthenticatedReturns401() {
        String singleUrl = templateUrl(existingTemplate.getEmailTemplateId());

        api.withoutPostProcessors().getAndRead(BASE_URL, Map.of(), Void.class, 401);
        api.withoutPostProcessors().getAndRead(singleUrl, null, Void.class, 401);
        api.withoutPostProcessors().postAndRead(BASE_URL, null, Void.class, 401);
        api.withoutPostProcessors().putAndRead(BASE_URL, null, Void.class, 401);
        api.withoutPostProcessors().deleteAndRead(singleUrl, null, Void.class, 401);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void forbiddenForNonProfessorReturns403() {
        ResearchGroup otherGroup = ResearchGroupTestData.saved(researchGroupRepository);
        User otherProfessor = UserTestData.savedProfessor(userRepository, otherGroup);

        String singleUrl = templateUrl(existingTemplate.getEmailTemplateId());

        api.with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR")).getAndRead(singleUrl, null, Void.class, 403);

        api
            .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(
                BASE_URL,
                dto(
                    existingTemplate.getEmailTemplateId(),
                    "Updated Template",
                    existingTemplate.getEmailType(),
                    tr("Updated Subject EN", "<p>Updated Body EN</p>"),
                    tr("Updated Subject DE", "<p>Updated Body DE</p>"),
                    false
                ),
                Void.class,
                403
            );

        api.with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR")).deleteAndRead(singleUrl, null, Void.class, 403);
    }
}
