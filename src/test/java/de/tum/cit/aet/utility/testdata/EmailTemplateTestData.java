package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Set;
import java.util.UUID;

/**
 * Test data helpers for EmailTemplate.
 */
public final class EmailTemplateTestData {

    private static final String DEFAULT_TEMPLATE_NAME = "Default Template";
    private static final String DEFAULT_SUBJECT = "Test Subject";
    private static final String DEFAULT_BODY = "<p>This is a test email body.</p>";

    private EmailTemplateTestData() {}

    // --- Unsaved variants ------------------------------------------------------------------------

    /**
     * Creates an unsaved EmailTemplate with required fields and default translations (EN + DE).
     */
    public static EmailTemplate newTemplate(ResearchGroup researchGroup, User creator, EmailType type) {
        return newTemplateAll(researchGroup, creator, type, DEFAULT_TEMPLATE_NAME, false, null);
    }

    /**
     * Creates an unsaved EmailTemplate with override options (null = keep default).
     */
    public static EmailTemplate newTemplateAll(
        ResearchGroup researchGroup,
        User creator,
        EmailType type,
        String templateName,
        boolean isDefault,
        Set<EmailTemplateTranslation> translations
    ) {
        EmailTemplate template = new EmailTemplate();
        template.setTemplateName(templateName != null ? templateName : DEFAULT_TEMPLATE_NAME);
        template.setResearchGroup(researchGroup);
        template.setEmailType(type);
        template.setDefault(isDefault);
        template.setCreatedBy(creator);

        if (translations == null || translations.isEmpty()) {
            template.setTranslations(
                Set.of(
                    newTranslation(template, Language.ENGLISH, DEFAULT_SUBJECT + " EN", DEFAULT_BODY + " EN"),
                    newTranslation(template, Language.GERMAN, DEFAULT_SUBJECT + " DE", DEFAULT_BODY + " DE")
                )
            );
        } else {
            translations.forEach(t -> t.setEmailTemplate(template));
            template.setTranslations(translations);
        }

        return template;
    }

    // --- Saved variants --------------------------------------------------------------------------

    /**
     * Saves a new EmailTemplate with a guaranteed unique name to avoid constraint violations.
     */
    public static EmailTemplate saved(EmailTemplateRepository repo, ResearchGroup researchGroup, User creator, EmailType type) {
        String uniqueName = DEFAULT_TEMPLATE_NAME + "-" + UUID.randomUUID().toString().substring(0, 8);
        return repo.save(newTemplateAll(researchGroup, creator, type, uniqueName, false, null));
    }

    /**
     * Saves a new EmailTemplate with a custom template name.
     */
    public static EmailTemplate savedWithName(
        EmailTemplateRepository repo,
        ResearchGroup researchGroup,
        User creator,
        EmailType type,
        String templateName
    ) {
        return repo.save(newTemplateAll(researchGroup, creator, type, templateName, false, null));
    }

    // --- Helper ---------------------------------------------------------------------------------

    private static EmailTemplateTranslation newTranslation(EmailTemplate template, Language language, String subject, String bodyHtml) {
        EmailTemplateTranslation translation = new EmailTemplateTranslation();
        translation.setLanguage(language);
        translation.setSubject(subject);
        translation.setBodyHtml(bodyHtml);
        translation.setEmailTemplate(template);
        return translation;
    }
}
