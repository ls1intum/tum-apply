package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.domain.UserSetting;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing user-specific settings.
 * Provides convenience methods for reading and writing boolean and string values.
 */
@Service
@RequiredArgsConstructor
public class UserSettingService {

    private final CurrentUserService currentUserService;
    private final UserSettingRepository userSettingRepository;

    /**
     * Retrieve a boolean setting of the current user. Missing values are interpreted as false.
     *
     * @param key the setting key
     * @return the boolean value of the setting, or false if not set
     */
    public boolean getBool(String key) {
        return get(key)
            .map(v -> "true".equalsIgnoreCase(v.trim()))
            .orElse(false);
    }

    /**
     * Set a boolean setting efficiently. Returns true if an insert or update was performed.
     *
     * @param key   the setting key
     * @param value the boolean value to set
     */
    public void setBool(String key, boolean value) {
        UUID userId = currentUserService.getUserId();
        userSettingRepository.upsert(userId, key, Boolean.toString(value));
    }

    /**
     * Retrieve a string setting of the current user.
     *
     * @param key the setting key
     * @return an Optional containing the string value if set, or empty if not set
     */
    private Optional<String> get(String key) {
        UUID userId = currentUserService.getUserId();
        return userSettingRepository.findByIdUserIdAndIdSettingKey(userId, key).map(UserSetting::getValue);
    }
}
