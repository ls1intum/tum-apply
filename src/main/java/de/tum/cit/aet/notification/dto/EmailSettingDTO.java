package de.tum.cit.aet.notification.dto;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailSetting;

public record EmailSettingDTO(EmailType emailType, boolean enabled) {
    /**
     * Creates an EmailSettingDTO from an EmailSetting entity.
     *
     * @param emailSetting the EmailSetting entity to convert
     * @return a new EmailSettingDTO with the email type and enabled status from the entity
     */
    public static EmailSettingDTO fromEmailSetting(EmailSetting emailSetting) {
        return new EmailSettingDTO(emailSetting.getEmailType(), emailSetting.isEnabled());
    }
}
