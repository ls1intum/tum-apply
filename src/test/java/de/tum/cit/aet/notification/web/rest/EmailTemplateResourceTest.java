package de.tum.cit.aet.notification.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

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
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class EmailTemplateResourceTest extends AbstractResourceTest {

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

    @Nested
    class GetTemplates {

        @Test
        void shouldReturnPageWithExistingTemplate() {
            PageResponseDTO<EmailTemplateOverviewDTO> page = asProfessor(professor).getAndRead(
                BASE_URL,
                Map.of("pageNumber", "0", "pageSize", "10"),
                new TypeReference<>() {},
                200
            );

            assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(1);
            assertThat(page.getContent())
                .extracting(
                    EmailTemplateOverviewDTO::emailTemplateId,
                    EmailTemplateOverviewDTO::templateName,
                    EmailTemplateOverviewDTO::emailType,
                    EmailTemplateOverviewDTO::isDefault
                )
                .contains(
                    tuple(
                        existingTemplate.getEmailTemplateId(),
                        existingTemplate.getTemplateName(),
                        existingTemplate.getEmailType(),
                        existingTemplate.isDefault()
                    )
                );
        }

        @Test
        void shouldRespectPaginationAndSorting() {
            for (int i = 0; i < 5; i++) {
                EmailTemplateTestData.savedWithName(
                    emailTemplateRepository,
                    researchGroup,
                    professor,
                    EmailType.APPLICATION_ACCEPTED,
                    "Template " + i
                );
            }

            PageResponseDTO<EmailTemplateOverviewDTO> page = asProfessor(professor).getAndRead(
                BASE_URL,
                Map.of("pageNumber", "0", "pageSize", "3"),
                new TypeReference<>() {},
                200
            );

            assertThat(page.getContent()).hasSize(3);
            assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(6);

            List<String> names = page.getContent().stream().map(EmailTemplateOverviewDTO::templateName).toList();
            assertThat(names).isSorted();
        }
    }

    @Nested
    class GetTemplate {

        @Test
        void shouldReturn200ForExistingTemplate() {
            EmailTemplateDTO dto = asProfessor(professor).getAndRead(
                templateUrl(existingTemplate.getEmailTemplateId()),
                Map.of(),
                EmailTemplateDTO.class,
                200
            );

            assertThat(dto)
                .extracting(
                    EmailTemplateDTO::emailTemplateId,
                    EmailTemplateDTO::templateName,
                    EmailTemplateDTO::emailType,
                    EmailTemplateDTO::isDefault
                )
                .containsExactly(
                    existingTemplate.getEmailTemplateId(),
                    existingTemplate.getTemplateName(),
                    existingTemplate.getEmailType(),
                    existingTemplate.isDefault()
                );
        }

        @Test
        void shouldReturn404ForNonExistingId() {
            asProfessor(professor).getAndRead(templateUrl(UUID.randomUUID()), Map.of(), Void.class, 404);
        }
    }

    @Nested
    class CreateTemplate {

        @Test
        void shouldCreateTemplateWithTranslations() {
            EmailTemplateDTO payload = dto(
                null,
                "Custom",
                EmailType.APPLICATION_ACCEPTED,
                tr("Subject EN", "<p>Body EN</p>"),
                tr("Subject DE", "<p>Body DE</p>"),
                false
            );

            EmailTemplateDTO created = asProfessor(professor).postAndRead(BASE_URL, payload, EmailTemplateDTO.class, 201);

            assertThat(created)
                .extracting(EmailTemplateDTO::templateName, t -> t.english().subject(), t -> t.german().subject())
                .containsExactly("Custom", "Subject EN", "Subject DE");
        }

        @Test
        void shouldAllowNullTranslations() {
            EmailTemplateDTO payload = dto(null, "NoTrans", EmailType.APPLICATION_ACCEPTED, null, null, false);

            EmailTemplateDTO created = asProfessor(professor).postAndRead(BASE_URL, payload, EmailTemplateDTO.class, 201);

            assertThat(created.templateName()).isEqualTo("NoTrans");
            assertThat(created.english()).isNull();
            assertThat(created.german()).isNull();
        }

        @Test
        void shouldReturn400IfTypeNotMultiple() {
            EmailTemplateDTO payload = dto(null, "SingleType", EmailType.APPLICATION_REJECTED, tr("s", "<p>b</p>"), null, false);

            asProfessor(professor).postAndRead(BASE_URL, payload, Void.class, 400);
        }

        @Test
        void shouldReturn409OnDuplicateName() {
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
    }

    @Nested
    class UpdateTemplate {

        @Test
        void shouldUpdateTemplateAndTranslations() {
            EmailTemplateDTO payload = dto(
                existingTemplate.getEmailTemplateId(),
                "Updated Template",
                existingTemplate.getEmailType(),
                tr("Updated Subject EN", "<p>Updated Body EN</p>"),
                tr("Updated Subject DE", "<p>Updated Body DE</p>"),
                false
            );

            EmailTemplateDTO updated = asProfessor(professor).putAndRead(BASE_URL, payload, EmailTemplateDTO.class, 200);

            assertThat(updated)
                .extracting(EmailTemplateDTO::templateName, t -> t.english().subject(), t -> t.german().subject())
                .containsExactly("Updated Template", "Updated Subject EN", "Updated Subject DE");
        }

        @Test
        void shouldReturn404IfNotExists() {
            EmailTemplateDTO payload = dto(UUID.randomUUID(), "Nope", EmailType.APPLICATION_ACCEPTED, null, null, false);

            asProfessor(professor).putAndRead(BASE_URL, payload, Void.class, 404);
        }

        @Test
        void shouldReturn400IfTypeNotEditable() {
            existingTemplate.setEmailType(EmailType.APPLICATION_RECEIVED); // assume not editable
            emailTemplateRepository.save(existingTemplate);

            EmailTemplateDTO payload = dto(
                existingTemplate.getEmailTemplateId(),
                "Try Update",
                existingTemplate.getEmailType(),
                null,
                null,
                false
            );

            asProfessor(professor).putAndRead(BASE_URL, payload, Void.class, 400);
        }
    }

    @Nested
    class DeleteTemplate {

        @Test
        void shouldDeleteNonDefaultTemplate() {
            UUID id = existingTemplate.getEmailTemplateId();

            asProfessor(professor).deleteAndRead(templateUrl(id), null, Void.class, 204);

            assertThat(emailTemplateRepository.findById(id)).isEmpty();
        }

        @Test
        void shouldReturn400IfDefaultTemplate() {
            existingTemplate.setDefault(true);
            emailTemplateRepository.save(existingTemplate);

            asProfessor(professor).deleteAndRead(templateUrl(existingTemplate.getEmailTemplateId()), null, Void.class, 400);
        }
    }

    @Nested
    class Authorization {

        @Test
        void shouldReturn401IfUnauthenticated() {
            String singleUrl = templateUrl(existingTemplate.getEmailTemplateId());

            api.withoutPostProcessors().getAndRead(BASE_URL, Map.of(), Void.class, 401);
            api.withoutPostProcessors().getAndRead(singleUrl, null, Void.class, 401);
            api.withoutPostProcessors().postAndRead(BASE_URL, null, Void.class, 401);
            api.withoutPostProcessors().putAndRead(BASE_URL, null, Void.class, 401);
            api.withoutPostProcessors().deleteAndRead(singleUrl, null, Void.class, 401);
        }

        @Test
        void shouldReturn403IfProfessorFromDifferentGroup() {
            ResearchGroup otherGroup = ResearchGroupTestData.saved(researchGroupRepository);
            User otherProfessor = UserTestData.savedProfessor(userRepository, otherGroup);

            String singleUrl = templateUrl(existingTemplate.getEmailTemplateId());

            api.with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR")).getAndRead(singleUrl, null, Void.class, 403);
        }
    }
}
