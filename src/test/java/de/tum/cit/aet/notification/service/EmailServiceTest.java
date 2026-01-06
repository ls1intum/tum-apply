package de.tum.cit.aet.notification.service;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.MailingException;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.Resource;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    private static final String FROM_ADDRESS = "noreply@test.local";
    private static final String TO_ADDRESS = "to1@test.local";
    private static final String CC_ADDRESS = "cc@test.local";
    private static final String BCC_ADDRESS = "bcc@test.local";

    private static final String SUBJECT = "Subject";
    private static final String CUSTOM_SUBJECT = "Custom Subject";
    private static final String ALT_SUBJECT = "Hello";
    private static final String SHORT_SUBJECT = "S";

    private static final String BODY_HTML = "<p>Body</p>";
    private static final String CUSTOM_BODY = "<p>Body</p>";
    private static final String ALT_BODY = "<b>Hi</b>";
    private static final String ALT_BODY_HTML = "<p>B</p>";

    private static final Object TEST_CONTENT = new Object();

    @Mock
    private TemplateProcessingService templateProcessingService;

    @Mock
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Mock
    private DocumentService documentService;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private EmailSettingService emailSettingService;

    @Mock
    private EmailTemplateService emailTemplateService;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    private Email.EmailBuilder baseEmail;

    @BeforeEach
    void init() {
        ReflectionTestUtils.setField(emailService, "from", FROM_ADDRESS);
        baseEmail = Email.builder().to(user(TO_ADDRESS)).emailType(EmailType.APPLICATION_SENT);
    }

    // --- Helper methods ---

    private static User user(String email) {
        User u = new User();
        u.setEmail(email);
        return u;
    }

    private static MimeMessage newMime() {
        return new JavaMailSenderImpl().createMimeMessage();
    }

    private void enableEmail() {
        ReflectionTestUtils.setField(emailService, "emailEnabled", true);
    }

    private void disableEmail() {
        ReflectionTestUtils.setField(emailService, "emailEnabled", false);
    }

    private void stubMailSender() {
        when(mailSenderProvider.getIfAvailable()).thenReturn(mailSender);
        when(mailSender.createMimeMessage()).thenReturn(newMime());
    }

    private EmailTemplateTranslation stubTemplateTranslation() {
        EmailTemplateTranslation tpl = new EmailTemplateTranslation();
        when(
            emailTemplateService.getTemplateTranslation(
                any(ResearchGroup.class),
                eq("default"),
                eq(EmailType.APPLICATION_SENT),
                eq(Language.ENGLISH)
            )
        ).thenReturn(tpl);
        return tpl;
    }

    private void stubRenderedFromTemplate(EmailTemplateTranslation tpl, Object content, String subject, String bodyHtml) {
        when(templateProcessingService.renderSubject(eq(tpl), eq(content))).thenReturn(subject);
        when(templateProcessingService.renderTemplate(eq(tpl), eq(content))).thenReturn(bodyHtml);
    }

    private void stubRenderedCustom(Object content, String subject, String bodyHtml) {
        when(templateProcessingService.renderSubject(eq(subject), eq(content))).thenReturn(subject);
        when(templateProcessingService.renderRawTemplate(eq(Language.ENGLISH), eq(bodyHtml))).thenReturn(bodyHtml);
    }

    @Nested
    class WhenSendingIsDisabled {

        @Test
        void logsOnlyAndDoesNotAcquireMailSender() {
            disableEmail();

            Email email = baseEmail
                .customSubject(ALT_SUBJECT)
                .customBody(ALT_BODY)
                .content(TEST_CONTENT)
                .language(Language.ENGLISH)
                .build();

            stubRenderedCustom(TEST_CONTENT, ALT_SUBJECT, ALT_BODY);

            emailService.send(email);

            verifyNoInteractions(documentService, documentRepository, emailTemplateService);
            verify(mailSenderProvider, never()).getIfAvailable();
        }

        @Test
        void doesNotResolveTemplateWhenTypeOrGroupMissing() {
            disableEmail();

            Email email = baseEmail
                .emailType(null)
                .researchGroup(new ResearchGroup())
                .templateName("any")
                .language(Language.ENGLISH)
                .customSubject(CUSTOM_SUBJECT)
                .customBody(CUSTOM_BODY)
                .content(TEST_CONTENT)
                .build();

            stubRenderedCustom(TEST_CONTENT, CUSTOM_SUBJECT, CUSTOM_BODY);

            emailService.send(email);

            verifyNoInteractions(emailTemplateService);
        }
    }

    @Nested
    class WhenSendingIsEnabledSuccess {

        @Test
        void sendsOnceAndRendersFromTemplate() {
            enableEmail();
            stubMailSender();

            EmailTemplateTranslation tpl = stubTemplateTranslation();
            stubRenderedFromTemplate(tpl, TEST_CONTENT, SUBJECT, BODY_HTML);

            Email email = baseEmail
                .researchGroup(new ResearchGroup())
                .templateName("default")
                .content(TEST_CONTENT)
                .language(Language.ENGLISH)
                .sendAlways(true)
                .build();

            emailService.send(email);

            verify(mailSender).send(any(MimeMessage.class));
            verify(templateProcessingService).renderSubject(eq(tpl), eq(TEST_CONTENT));
            verify(templateProcessingService).renderTemplate(eq(tpl), eq(TEST_CONTENT));
        }

        @Test
        void sendsWithCcBccAndAttachments() throws Exception {
            enableEmail();
            stubMailSender();

            EmailTemplateTranslation tpl = stubTemplateTranslation();
            stubRenderedFromTemplate(tpl, TEST_CONTENT, SHORT_SUBJECT, ALT_BODY_HTML);

            UUID docId = UUID.randomUUID();
            Document doc = new Document();
            Resource res = mock(Resource.class);

            when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));
            when(documentService.download(doc)).thenReturn(res);
            when(res.getContentAsByteArray()).thenReturn("pdf".getBytes(StandardCharsets.UTF_8));

            Email email = Email.builder()
                .to(user(TO_ADDRESS))
                .cc(user(CC_ADDRESS))
                .bcc(user(BCC_ADDRESS))
                .researchGroup(new ResearchGroup())
                .templateName("default")
                .emailType(EmailType.APPLICATION_SENT)
                .content(TEST_CONTENT)
                .sendAlways(true)
                .documentIds(Set.of(docId))
                .build();

            emailService.send(email);

            verify(mailSender).send(any(MimeMessage.class));
            verify(documentRepository).findById(docId);
            verify(documentService).download(doc);
        }
    }

    @Nested
    class WhenRecipientsAreFilteredOut {

        @Test
        void doesNotSendIfNoRecipientsRemain() {
            enableEmail();
            stubMailSender();

            User u1 = user("a@test.local");
            User u2 = user("b@test.local");

            Email email = Email.builder()
                .to(u1)
                .to(u2)
                .customSubject(CUSTOM_SUBJECT)
                .customBody(CUSTOM_BODY)
                .emailType(EmailType.APPLICATION_SENT)
                .language(Language.ENGLISH)
                .build();

            when(emailSettingService.canNotify(EmailType.APPLICATION_SENT, u1)).thenReturn(false);
            when(emailSettingService.canNotify(EmailType.APPLICATION_SENT, u2)).thenReturn(false);

            emailService.send(email);

            verify(mailSender, never()).send(any(MimeMessage.class));
        }
    }

    @Nested
    class FailureScenarios {

        @Test
        void throwsIfMailSenderNotConfigured() {
            enableEmail();
            when(mailSenderProvider.getIfAvailable()).thenReturn(null);

            Email email = baseEmail.sendAlways(true).build();

            assertThatThrownBy(() -> emailService.send(email))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Mail sender not configured");
        }

        @Test
        void propagatesUploadExceptionFromAttachmentDownload() throws Exception {
            enableEmail();
            stubMailSender();

            EmailTemplateTranslation tpl = stubTemplateTranslation();
            stubRenderedFromTemplate(tpl, TEST_CONTENT, SHORT_SUBJECT, ALT_BODY_HTML);

            UUID docId = UUID.randomUUID();
            Document doc = new Document();
            when(documentRepository.findById(docId)).thenReturn(Optional.of(doc));
            when(documentService.download(doc)).thenThrow(new UploadException("io boom"));

            Email email = baseEmail
                .researchGroup(new ResearchGroup())
                .templateName("default")
                .content(TEST_CONTENT)
                .sendAlways(true)
                .documentIds(Set.of(docId))
                .build();

            assertThatThrownBy(() -> emailService.send(email))
                .isInstanceOf(UploadException.class)
                .hasMessageContaining("io boom");

            verify(mailSender, never()).send(any(MimeMessage.class));
        }

        @Test
        void throwsEntityNotFoundIfDocumentMissing() {
            enableEmail();
            stubMailSender();

            UUID missing = UUID.randomUUID();
            when(documentRepository.findById(missing)).thenReturn(Optional.empty());

            EmailTemplateTranslation tpl = stubTemplateTranslation();
            stubRenderedFromTemplate(tpl, TEST_CONTENT, SHORT_SUBJECT, ALT_BODY_HTML);

            Email email = baseEmail
                .researchGroup(new ResearchGroup())
                .templateName("default")
                .content(TEST_CONTENT)
                .sendAlways(true)
                .documentIds(Set.of(missing))
                .build();

            assertThatThrownBy(() -> emailService.send(email)).isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        void wrapsMailSenderExceptionInMailingException() {
            enableEmail();
            stubMailSender();

            EmailTemplateTranslation tpl = stubTemplateTranslation();
            stubRenderedFromTemplate(tpl, TEST_CONTENT, SUBJECT, BODY_HTML);

            Email email = baseEmail
                .researchGroup(new ResearchGroup())
                .templateName("default")
                .content(TEST_CONTENT)
                .sendAlways(true)
                .build();

            doThrow(new MailSendException("mail boom")).when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.send(email))
                .isInstanceOf(MailingException.class)
                .hasMessageContaining("mail boom");

            verify(mailSender).send(any(MimeMessage.class));
        }
    }

    @Nested
    class Recovery {

        @Test
        void recoverMailingExceptionDoesNotThrow() {
            Email email = baseEmail.sendAlways(true).build();
            MailingException ex = new MailingException("Simulated failure");

            assertThatNoException().isThrownBy(() -> emailService.recoverMailingException(ex, email));
        }
    }
}
