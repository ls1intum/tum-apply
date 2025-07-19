package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailSetting;

public record EmailSettingDTO(EmailType emailType, boolean enabled) {
    public static EmailSettingDTO fromEmailSetting(EmailSetting emailSetting) {
        return new EmailSettingDTO(emailSetting.getEmailType(), emailSetting.isEnabled());
    }
}
