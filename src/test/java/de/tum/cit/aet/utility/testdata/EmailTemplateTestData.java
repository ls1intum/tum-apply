package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Set;

/**
 * Test data helpers for EmailTemplate.
 */
public final class EmailTemplateTestData {

    private EmailTemplateTestData() {}

    // --- Defaults --------------------------------------------------------------------------------

    private static final String DEFAULT_TEMPLATE_NAME = "Default Template";
    private static final String DEFAULT_SUBJECT = "Test Subject";
    private static final String DEFAULT_BODY = "<p>This is a test email body.</p>";

    // --- Unsaved variants ------------------------------------------------------------------------

    /**
     * Creates an unsaved EmailTemplate with required fields and default translations (EN + DE).
     */
    public static EmailTemplate newTemplate(ResearchGroup researchGroup, User creator, EmailType type) {
        EmailTemplate template = new EmailTemplate();
        template.setTemplateName(DEFAULT_TEMPLATE_NAME);
        template.setResearchGroup(researchGroup);
        template.setEmailType(type);
        template.setDefault(false);
        template.setCreatedBy(creator);

        // Add default translations
        template.setTranslations(
            Set.of(
                newTranslation(template, Language.ENGLISH, DEFAULT_SUBJECT + " EN", DEFAULT_BODY + " EN"),
                newTranslation(template, Language.GERMAN, DEFAULT_SUBJECT + " DE", DEFAULT_BODY + " DE")
            )
        );

        return template;
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
        EmailTemplate template = newTemplate(researchGroup, creator, type);

        if (templateName != null) {
            template.setTemplateName(templateName);
        }
        template.setDefault(isDefault);
        if (translations != null && !translations.isEmpty()) {
            translations.forEach(t -> t.setEmailTemplate(template));
            template.setTranslations(translations);
        }

        return template;
    }

    // --- Saved variants --------------------------------------------------------------------------

    /**
     * Saves a new EmailTemplate with given ResearchGroup, Creator, and EmailType.
     */
    public static EmailTemplate saved(EmailTemplateRepository repo, ResearchGroup researchGroup, User creator, EmailType type) {
        return repo.save(newTemplate(researchGroup, creator, type));
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
