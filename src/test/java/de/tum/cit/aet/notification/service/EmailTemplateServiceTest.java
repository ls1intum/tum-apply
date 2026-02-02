package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceTest {

    private static final String TEMPLATE_NAME = null;
    private static final String SUBJECT_TEXT = "Application Status";
    private static final String BODY_HTML = "<p>Your application has been processed</p>";

    @Mock
    private EmailTemplateRepository emailTemplateRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Captor
    private ArgumentCaptor<Iterable<EmailTemplate>> templateIterableCaptor;

    @Captor
    private ArgumentCaptor<EmailTemplate> templateCaptor;

    private EmailTemplateService emailTemplateService;

    private ResearchGroupRepository researchGroupRepository;

    private ResearchGroup researchGroup;

    @BeforeEach
    void setUp() {
        emailTemplateService = new EmailTemplateService(emailTemplateRepository, researchGroupRepository, currentUserService);
        researchGroup = createResearchGroup();
    }

    @Nested
    @DisplayName("get() method")
    class GetMethod {

        @Test
        void shouldReturnTemplateWhenFound() {
            EmailTemplate expectedTemplate = createEmailTemplate(EmailType.APPLICATION_ACCEPTED);
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.of(expectedTemplate));

            EmailTemplate result = emailTemplateService.get(researchGroup, TEMPLATE_NAME, EmailType.APPLICATION_ACCEPTED);

            assertThat(result).isNotNull().isSameAs(expectedTemplate);
            verify(emailTemplateRepository).findByResearchGroupAndTemplateNameAndEmailType(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED
            );
            verifyNoMoreInteractions(emailTemplateRepository);
        }

        @Test
        void shouldCreateTemplateWhenNotFound() {
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.empty());
            when(emailTemplateRepository.save(templateCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

            EmailTemplate result = emailTemplateService.get(researchGroup, TEMPLATE_NAME, EmailType.APPLICATION_ACCEPTED);

            assertThat(result).isNotNull();
            assertThat(result.getEmailType()).isEqualTo(EmailType.APPLICATION_ACCEPTED);
            verify(emailTemplateRepository).findByResearchGroupAndTemplateNameAndEmailType(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED
            );

            EmailTemplate savedTemplate = templateCaptor.getValue();
            assertThat(savedTemplate.getEmailType()).isEqualTo(EmailType.APPLICATION_ACCEPTED);
            assertThat(savedTemplate.getResearchGroup()).isEqualTo(researchGroup);
        }

        @Test
        void shouldHandleDifferentEmailTypes() {
            EmailTemplate rejectedTemplate = createEmailTemplate(EmailType.APPLICATION_REJECTED);
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_REJECTED
                )
            ).thenReturn(Optional.of(rejectedTemplate));

            EmailTemplate result = emailTemplateService.get(researchGroup, TEMPLATE_NAME, EmailType.APPLICATION_REJECTED);

            assertThat(result).isNotNull().extracting(EmailTemplate::getEmailType).isEqualTo(EmailType.APPLICATION_REJECTED);
        }
    }

    @Nested
    @DisplayName("getTemplateTranslation() method")
    class GetTemplateTranslationMethod {

        @Test
        void shouldReturnTranslationWhenLanguageExists() {
            EmailTemplate template = createEmailTemplateWithTranslation(Language.ENGLISH);
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.of(template));

            EmailTemplateTranslation result = emailTemplateService.getTemplateTranslation(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED,
                Language.ENGLISH
            );

            assertThat(result).isNotNull();
            assertThat(result.getLanguage()).isEqualTo(Language.ENGLISH);
            assertThat(result.getSubject()).isEqualTo(SUBJECT_TEXT);
            assertThat(result.getBodyHtml()).isEqualTo(BODY_HTML);
            verify(emailTemplateRepository).findByResearchGroupAndTemplateNameAndEmailType(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED
            );
            verifyNoMoreInteractions(emailTemplateRepository);
        }

        @Test
        void shouldReturnNullWhenLanguageDoesNotExist() {
            EmailTemplate template = createEmailTemplate(EmailType.APPLICATION_ACCEPTED);
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.of(template));

            EmailTemplateTranslation result = emailTemplateService.getTemplateTranslation(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED,
                Language.GERMAN
            );

            assertThat(result).isNull();
            verify(emailTemplateRepository).findByResearchGroupAndTemplateNameAndEmailType(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED
            );
            verifyNoMoreInteractions(emailTemplateRepository);
        }

        @Test
        void shouldReturnCorrectTranslationWhenMultipleExist() {
            EmailTemplate template = createEmailTemplate(EmailType.APPLICATION_ACCEPTED);
            template.getTranslations().add(createTranslation(Language.ENGLISH, "English Subject", "English Body"));
            template.getTranslations().add(createTranslation(Language.GERMAN, "German Subject", "German Body"));

            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.of(template));

            EmailTemplateTranslation result = emailTemplateService.getTemplateTranslation(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED,
                Language.GERMAN
            );

            assertThat(result).isNotNull();
            assertThat(result.getLanguage()).isEqualTo(Language.GERMAN);
            assertThat(result.getSubject()).isEqualTo("German Subject");
            assertThat(result.getBodyHtml()).isEqualTo("German Body");
        }

        @Test
        void shouldCreateTemplateWhenNotFound() {
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.empty());
            when(emailTemplateRepository.save(templateCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

            EmailTemplateTranslation result = emailTemplateService.getTemplateTranslation(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED,
                Language.ENGLISH
            );

            // Lazy-init creates template with default translations
            assertThat(result).isNotNull();

            EmailTemplate savedTemplate = templateCaptor.getValue();
            assertThat(savedTemplate.getEmailType()).isEqualTo(EmailType.APPLICATION_ACCEPTED);
            assertThat(savedTemplate.getResearchGroup()).isEqualTo(researchGroup);
        }
    }

    @Nested
    @DisplayName("addMissingTemplates() method")
    class AddMissingTemplatesMethod {

        @Test
        void shouldNotSaveWhenAllTypesExist() {
            Set<EmailType> allEmailTypes = EnumSet.allOf(EmailType.class);
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(allEmailTypes);

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).findAllEmailTypesByResearchGroup(researchGroup);
            verify(emailTemplateRepository, never()).saveAll(any());
            verifyNoMoreInteractions(emailTemplateRepository);
        }

        @Test
        @DisplayName("should create templates for all email types when none exist")
        void shouldCreateAllTemplatesWhenNoneExist() {
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(Set.of());

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).findAllEmailTypesByResearchGroup(researchGroup);
            verify(emailTemplateRepository).saveAll(templateIterableCaptor.capture());

            List<EmailTemplate> savedTemplates = StreamSupport.stream(templateIterableCaptor.getValue().spliterator(), false).toList();

            int expectedCount = EmailType.values().length + (RejectReason.values().length - 1);

            assertThat(savedTemplates).hasSize(expectedCount);

            Set<EmailType> createdTypes = savedTemplates.stream().map(EmailTemplate::getEmailType).collect(Collectors.toSet());
            assertThat(createdTypes).containsExactlyInAnyOrder(EmailType.values());

            assertThat(savedTemplates).allSatisfy(template -> {
                assertThat(template.getResearchGroup()).isEqualTo(researchGroup);
                assertThat(template.isDefault()).isTrue();
                assertThat(template.getTranslations()).hasSize(2);
            });
            long rejectionCount = savedTemplates
                .stream()
                .filter(t -> t.getEmailType() == EmailType.APPLICATION_REJECTED)
                .count();
            assertThat(rejectionCount).isEqualTo(RejectReason.values().length);
        }

        @Test
        void shouldCreateTemplatePerRejectReason() {
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(Set.of());

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).saveAll(templateIterableCaptor.capture());

            List<EmailTemplate> savedTemplates = StreamSupport.stream(templateIterableCaptor.getValue().spliterator(), false).toList();

            assertThat(savedTemplates)
                .filteredOn(t -> t.getEmailType() == EmailType.APPLICATION_REJECTED)
                .hasSize(RejectReason.values().length);
        }

        @Test
        void shouldCreateOnlyMissingTemplates() {
            Set<EmailType> existingTypes = Set.of(EmailType.APPLICATION_ACCEPTED);
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(existingTypes);

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).saveAll(templateIterableCaptor.capture());

            List<EmailTemplate> savedTemplates = StreamSupport.stream(templateIterableCaptor.getValue().spliterator(), false).toList();

            assertThat(savedTemplates).extracting(EmailTemplate::getEmailType).doesNotContain(EmailType.APPLICATION_ACCEPTED);

            assertThat(savedTemplates).isNotEmpty();
        }

        @Test
        void shouldSetResearchGroupOnCreatedTemplates() {
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(Set.of());

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).saveAll(
                argThat(savedIterable -> {
                    List<EmailTemplate> savedTemplates = StreamSupport.stream(savedIterable.spliterator(), false).toList();

                    assertThat(savedTemplates).allSatisfy(template -> assertThat(template.getResearchGroup()).isEqualTo(researchGroup));
                    return true;
                })
            );
        }

        @Nested
        @DisplayName("readTemplateContent() method")
        class ReadTemplateContentMethod {

            @Test
            void readTemplateContentShouldThrowWhenFileMissing() {
                assertThatThrownBy(() -> emailTemplateService.readTemplateContent("does_not_exist.html"))
                    .isInstanceOf(TemplateProcessingException.class)
                    .hasMessageContaining("Failed to read template file");
            }
        }
    }

    private ResearchGroup createResearchGroup() {
        ResearchGroup group = new ResearchGroup();
        group.setResearchGroupId(UUID.randomUUID());
        group.setName("Test Research Group");
        return group;
    }

    private EmailTemplate createEmailTemplate(EmailType emailType) {
        EmailTemplate template = new EmailTemplate();
        template.setEmailType(emailType);
        template.setTemplateName(TEMPLATE_NAME);
        template.setResearchGroup(researchGroup);
        return template;
    }

    private EmailTemplate createEmailTemplateWithTranslation(Language language) {
        EmailTemplate template = createEmailTemplate(EmailType.APPLICATION_ACCEPTED);
        EmailTemplateTranslation translation = createTranslation(language, SUBJECT_TEXT, BODY_HTML);
        template.getTranslations().add(translation);
        return template;
    }

    private EmailTemplateTranslation createTranslation(Language language, String subject, String bodyHtml) {
        EmailTemplateTranslation translation = new EmailTemplateTranslation();
        translation.setLanguage(language);
        translation.setSubject(subject);
        translation.setBodyHtml(bodyHtml);
        return translation;
    }
}
