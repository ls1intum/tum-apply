package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailSetting;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Test data helpers for EmailSetting.
 */
public final class EmailSettingTestData {

    private EmailSettingTestData() {}

    /** Creates an unsaved EmailSetting with sensible defaults. */
    public static EmailSetting newEmailSetting(User user, EmailType emailType, Boolean enabled) {
        EmailSetting es = new EmailSetting();
        es.setUser(user);
        es.setEmailType(emailType != null ? emailType : EmailType.APPLICATION_SENT);
        es.setEnabled(enabled != null ? enabled : true);
        return es;
    }

    /** Unsaved EmailSetting with override options (null = keep default). */
    public static EmailSetting newEmailSettingAll(User user, EmailType emailType, Boolean enabled) {
        return newEmailSetting(user, emailType, enabled);
    }

    // --- Convenience creators for common cases (unsaved) -----------------------------------------
    public static EmailSetting enabled(User user, EmailType emailType) {
        return newEmailSetting(user, emailType, true);
    }

    public static EmailSetting disabled(User user, EmailType emailType) {
        return newEmailSetting(user, emailType, false);
    }

    // --- Saved variants -------------------------------------------------------------------------
    public static EmailSetting saved(EmailSettingRepository repo, User user, EmailType emailType, Boolean enabled) {
        return repo.save(newEmailSetting(user, emailType, enabled));
    }

    public static EmailSetting savedEnabled(EmailSettingRepository repo, User user, EmailType emailType) {
        return repo.save(enabled(user, emailType));
    }

    public static EmailSetting savedDisabled(EmailSettingRepository repo, User user, EmailType emailType) {
        return repo.save(disabled(user, emailType));
    }

    public static EmailSetting savedAll(EmailSettingRepository repo, User user, EmailType emailType, Boolean enabled) {
        return repo.save(newEmailSettingAll(user, emailType, enabled));
    }
}
