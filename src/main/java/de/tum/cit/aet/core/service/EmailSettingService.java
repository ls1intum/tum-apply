package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailSetting;
import de.tum.cit.aet.core.dto.EmailSettingDTO;
import de.tum.cit.aet.core.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class EmailSettingService {

    private final EmailSettingRepository emailSettingRepository;

    @Transactional // ensures new settings are persisted and visible in the same DB transaction
    public boolean canNotify(EmailType emailType, User user) {
        updateUserEmailSettings(user);

        Optional<EmailSetting> emailSetting = emailSettingRepository.findByUserAndEmailType(user, emailType);

        if (emailSetting.isPresent()) {
            return emailSetting.get().isEnabled();
        }
        throw new IllegalStateException("User " + user.getUserId() + " has not the required role to receive this email");
    }

    @Transactional // ensures new settings are persisted and visible in the same DB transaction
    public Set<EmailSettingDTO> getSettingsForUser(User user) {
        updateUserEmailSettings(user);
        return emailSettingRepository.findAllByUser(user).stream().map(EmailSettingDTO::fromEmailSetting).collect(Collectors.toSet());
    }

    @Transactional // ensures new settings are persisted and visible in the same DB transaction
    public Set<EmailSettingDTO> updateSettingsForUser(Set<EmailSettingDTO> settingDTOs, User user) {
        updateUserEmailSettings(user);

        Set<EmailSetting> userSettings = new HashSet<>(emailSettingRepository.findAllByUser(user));

        Map<EmailType, EmailSetting> settingMap = userSettings.stream().collect(Collectors.toMap(EmailSetting::getEmailType, s -> s));

        for (EmailSettingDTO dto : settingDTOs) {
            EmailSetting setting = settingMap.get(dto.emailType());

            if (setting == null) {
                throw new IllegalStateException(
                    "User %s is not allowed to receive email type: %s".formatted(user.getUserId(), dto.emailType())
                );
            }

            setting.setEnabled(dto.enabled());
        }

        return emailSettingRepository
            .saveAll(settingMap.values())
            .stream()
            .map(EmailSettingDTO::fromEmailSetting)
            .collect(Collectors.toSet());
    }

    private void updateUserEmailSettings(User user) {
        Set<EmailType> requiredTypes = getAvailableEmailTypesForUser(user);

        Set<EmailType> existingTypes = emailSettingRepository
            .findAllByUser(user)
            .stream()
            .map(EmailSetting::getEmailType)
            .collect(Collectors.toSet());

        Set<EmailSetting> missingSettings = requiredTypes
            .stream()
            .filter(type -> !existingTypes.contains(type))
            .map(type -> {
                EmailSetting setting = new EmailSetting();
                setting.setUser(user);
                setting.setEmailType(type);
                setting.setEnabled(true);
                return setting;
            })
            .collect(Collectors.toSet());

        if (!missingSettings.isEmpty()) {
            emailSettingRepository.saveAll(missingSettings);
        }
    }

    private Set<EmailType> getAvailableEmailTypesForUser(@NonNull User user) {
        Set<UserRole> userRoles = user.getResearchGroupRoles().stream().map(UserResearchGroupRole::getRole).collect(Collectors.toSet());

        return Arrays.stream(EmailType.values())
            .filter(emailType -> !Collections.disjoint(userRoles, emailType.getRoles()))
            .collect(Collectors.toSet());
    }
}
