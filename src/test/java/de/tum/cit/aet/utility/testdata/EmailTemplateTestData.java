package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Test data helpers for EmailTemplate.
 */
public final class EmailTemplateTestData {

    private static final String DEFAULT_SUBJECT = "Test Subject";
    private static final String DEFAULT_BODY = "<p>This is a test email body.</p>";

    private EmailTemplateTestData() {}

    /**
     * Creates an unsaved EmailTemplate with default English + German content.
     */
    public static EmailTemplate newTemplate(ResearchGroup researchGroup, User creator, EmailType type) {
        EmailTemplate template = new EmailTemplate();
        template.setResearchGroup(researchGroup);
        template.setEmailType(type);
        template.setCreatedBy(creator);
        template.setSubjectEn(DEFAULT_SUBJECT + " EN");
        template.setBodyHtmlEn(DEFAULT_BODY + " EN");
        template.setSubjectDe(DEFAULT_SUBJECT + " DE");
        template.setBodyHtmlDe(DEFAULT_BODY + " DE");
        return template;
    }

    /**
     * Saves a new EmailTemplate for the given (research_group, email_type) pair.
     */
    public static EmailTemplate saved(EmailTemplateRepository repo, ResearchGroup researchGroup, User creator, EmailType type) {
        return repo.save(newTemplate(researchGroup, creator, type));
    }
}
