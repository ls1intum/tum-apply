package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailSetting;
import de.tum.cit.aet.core.dto.EmailSettingDTO;
import de.tum.cit.aet.core.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class EmailSettingService {

    private final EmailSettingRepository emailSettingRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    /**
     * Checks if a user can be notified for a specific email type based on their settings.
     * Updates user email settings before checking to ensure all required settings exist.
     *
     * @param emailType the type of email to check notification permission for
     * @param user the user to check notification settings for
     * @return true if the user has enabled notifications for this email type, false otherwise
     * @throws IllegalStateException if the user doesn't have the required role to receive this email type
     */
    @Transactional // ensures new settings are persisted and visible in the same DB transaction
    public boolean canNotify(EmailType emailType, User user) {
        updateUserEmailSettings(user);

        Optional<EmailSetting> emailSetting = emailSettingRepository.findByUserAndEmailType(user, emailType);

        if (emailSetting.isPresent()) {
            return emailSetting.get().isEnabled();
        }
        throw new IllegalStateException(String.format("User %s has not the required role to receive this email", user.getUserId()));
    }

    /**
     * Retrieves all email settings for a specific user.
     * Updates user email settings before retrieval to ensure all required settings exist.
     *
     * @param user the user to retrieve email settings for
     * @return a set of EmailSettingDTO objects representing the user's email preferences
     */
    @Transactional // ensures new settings are persisted and visible in the same DB transaction
    public Set<EmailSettingDTO> getSettingsForUser(User user) {
        updateUserEmailSettings(user);
        return emailSettingRepository.findAllByUser(user).stream().map(EmailSettingDTO::fromEmailSetting).collect(Collectors.toSet());
    }

    /**
     * Updates email settings for a specific user with the provided settings.
     * Validates that the user has permission to modify each email type before updating.
     *
     * @param settingDTOs a set of EmailSettingDTO objects containing the new email preferences
     * @param user the user whose email settings should be updated
     * @return a set of updated EmailSettingDTO objects after successful persistence
     * @throws IllegalStateException if the user attempts to modify an email type they're not allowed to receive
     */
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

    /**
     * Updates user email settings by creating missing settings for email types the user is eligible for.
     * Compares required email types based on user roles with existing settings and creates defaults for missing ones.
     *
     * @param user the user whose email settings should be updated with missing defaults
     */
    private void updateUserEmailSettings(User user) {
        Set<EmailType> requiredTypes = getAvailableEmailTypesForUser(user);

        Set<EmailType> existingTypes = emailSettingRepository.findAvailableEmailTypesForUser(user);

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

    /**
     * Determines which email types a user is eligible to receive based on their roles.
     * Filters all available email types to only include those matching the user's current roles.
     *
     * @param user the user to determine available email types for (must not be null)
     * @return a set of EmailType values that the user is eligible to receive based on their roles
     */
    private Set<EmailType> getAvailableEmailTypesForUser(@NonNull User user) {
        Set<UserRole> userRoles = userResearchGroupRoleRepository
            .findAllByUser(user).stream().map(UserResearchGroupRole::getRole).collect(Collectors.toSet());

        return Arrays.stream(EmailType.values())
            .filter(emailType -> !Collections.disjoint(userRoles, emailType.getRoles()))
            .collect(Collectors.toSet());
    }
}
