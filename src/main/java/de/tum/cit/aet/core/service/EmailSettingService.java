package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailSetting;
import de.tum.cit.aet.core.notification.Email;
import de.tum.cit.aet.core.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmailSettingService {

    private final EmailSettingRepository emailSettingRepository;

    public boolean canNotify(Email email, User user) {
        Optional<EmailSetting> emailSetting = Optional.ofNullable(
            emailSettingRepository.findByUserAndEmailType(user, email.getEmailType())
        );

        if (emailSetting.isPresent()) {
            return emailSetting.get().isEnabled();
        }

        if (getAvailableEmailTypesForUser(user).contains(email.getEmailType())) {
            EmailSetting newEmailSetting = new EmailSetting();
            newEmailSetting.setUser(user);
            newEmailSetting.setEmailType(email.getEmailType());
            newEmailSetting.setEnabled(true);
            emailSettingRepository.save(newEmailSetting);
            return true;
        }
        throw new IllegalStateException("User " + user.getUserId() + " has not the required role to receive this message");
    }

    private Set<EmailType> getAvailableEmailTypesForUser(User user) {
        Set<UserRole> userRoles = user.getResearchGroupRoles().stream().map(UserResearchGroupRole::getRole).collect(Collectors.toSet());

        return Arrays.stream(EmailType.values())
            .filter(emailType -> !Collections.disjoint(userRoles, emailType.getRoles()))
            .collect(Collectors.toSet());
    }
}
