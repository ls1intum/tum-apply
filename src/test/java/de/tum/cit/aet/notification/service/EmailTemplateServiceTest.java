package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.*;
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

    private static final String TEMPLATE_NAME = "application-template";
    private static final String SUBJECT_TEXT = "Application Status";
    private static final String BODY_HTML = "<p>Your application has been processed</p>";

    @Mock
    private EmailTemplateRepository emailTemplateRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Captor
    private ArgumentCaptor<Iterable<EmailTemplate>> templateIterableCaptor;

    private EmailTemplateService emailTemplateService;

    private ResearchGroup researchGroup;

    @BeforeEach
    void setUp() {
        emailTemplateService = new EmailTemplateService(emailTemplateRepository, currentUserService);
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
        void shouldThrowExceptionWhenTemplateNotFound() {
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.empty());

            assertThatThrownBy(() -> emailTemplateService.get(researchGroup, TEMPLATE_NAME, EmailType.APPLICATION_ACCEPTED)).isInstanceOf(
                EntityNotFoundException.class
            );
            verify(emailTemplateRepository).findByResearchGroupAndTemplateNameAndEmailType(
                researchGroup,
                TEMPLATE_NAME,
                EmailType.APPLICATION_ACCEPTED
            );
            verifyNoMoreInteractions(emailTemplateRepository);
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
        void shouldThrowExceptionWhenTemplateDoesNotExist() {
            when(
                emailTemplateRepository.findByResearchGroupAndTemplateNameAndEmailType(
                    researchGroup,
                    TEMPLATE_NAME,
                    EmailType.APPLICATION_ACCEPTED
                )
            ).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                emailTemplateService.getTemplateTranslation(researchGroup, TEMPLATE_NAME, EmailType.APPLICATION_ACCEPTED, Language.ENGLISH)
            ).isInstanceOf(EntityNotFoundException.class);
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

            assertThat(savedTemplates).isNotEmpty();
        }

        @Test
        void shouldCreateTemplatePerRejectReason() {
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(Set.of());

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).saveAll(
                argThat(savedIterable -> {
                    List<EmailTemplate> savedTemplates = StreamSupport.stream(savedIterable.spliterator(), false).toList();

                    long rejectionTemplateCount = savedTemplates
                        .stream()
                        .filter(template -> template.getEmailType() == EmailType.APPLICATION_REJECTED)
                        .count();

                    assertThat(rejectionTemplateCount).isEqualTo(RejectReason.values().length);
                    return true;
                })
            );
        }

        @Test
        void shouldCreateOnlyMissingTemplates() {
            Set<EmailType> existingTypes = Set.of(EmailType.APPLICATION_ACCEPTED);
            when(emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup)).thenReturn(existingTypes);

            emailTemplateService.addMissingTemplates(researchGroup);

            verify(emailTemplateRepository).saveAll(
                argThat(savedIterable -> {
                    List<EmailTemplate> savedTemplates = StreamSupport.stream(savedIterable.spliterator(), false).toList();

                    boolean hasAcceptedTemplate = savedTemplates
                        .stream()
                        .anyMatch(template -> template.getEmailType() == EmailType.APPLICATION_ACCEPTED);

                    assertThat(hasAcceptedTemplate).isFalse();
                    assertThat(savedTemplates).isNotEmpty();
                    return true;
                })
            );
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

        //        @Nested
        //        @DisplayName("readTemplateContent() method")
        //        class ReadTemplateContentMethod {
        //
        //            @Test
        //            void shouldThrowTemplateProcessingExceptionWhenFileMissing() throws Exception {
        //                Method method = EmailTemplateService.class.getDeclaredMethod("readTemplateContent", String.class);
        //                method.setAccessible(true);
        //
        //                String nonExistentPath = "not-existing-file.html";
        //
        //                assertThatThrownBy(() -> method.invoke(emailTemplateService, nonExistentPath))
        //                    .hasCauseInstanceOf(TemplateProcessingException.class)
        //                    .cause()
        //                    .hasMessageContaining("Failed to read template file: " + nonExistentPath);
        //            }
        //        }
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
