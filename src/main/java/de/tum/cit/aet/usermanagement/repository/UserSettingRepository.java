package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.UserSetting;
import de.tum.cit.aet.usermanagement.domain.key.UserSettingId;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link UserSetting} entity.
 * Provides methods to query and update user-specific settings.
 */
@Repository
public interface UserSettingRepository extends TumApplyJpaRepository<UserSetting, UserSettingId> {
    /**
     * Find a specific setting by user id and setting key.
     *
     * @param userId the UUID of the user
     * @param key    the setting key
     * @return optional containing the setting if present
     */
    Optional<UserSetting> findByIdUserIdAndIdSettingKey(UUID userId, String key);

    /**
     * Upsert a user setting (insert if not exists, update if exists and value changed).
     *
     * @param userId the UUID of the user
     * @param key    the setting key
     * @param value  the value of the setting
     * @return true if an insert or update was performed, false if the existing value was unchanged
     */
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO user_settings (user_id, setting_key, setting_value)
        VALUES (:userId, :key, :value) AS new
        ON DUPLICATE KEY UPDATE
          setting_value = IF(new.setting_value <> user_settings.setting_value, new.setting_value, user_settings.setting_value),
          updated_at    = IF(new.setting_value <> user_settings.setting_value, CURRENT_TIMESTAMP, user_settings.updated_at)
        """, nativeQuery = true)
    boolean upsert(@Param("userId") UUID userId, @Param("key") String key, @Param("value") String value);
}
