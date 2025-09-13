package de.tum.cit.aet.usermanagement.domain;

import de.tum.cit.aet.usermanagement.domain.key.UserSettingId;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

/**
 * Entity representing a single user setting.
 * Each setting is uniquely identified by a composite key (userId + settingKey).
 * Stores the setting value as a string.
 */
@Getter
@Setter
@Entity
@Table(name = "user_settings")
@NoArgsConstructor
public class UserSetting {

    /**
     * Composite primary key consisting of the user id and the setting key.
     */
    @EmbeddedId
    private UserSettingId id;

    /**
     * The user to whom this setting belongs.
     * Mapped via the userId part of the composite key.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The value of the setting stored as a string.
     */
    @Column(name = "setting_value")
    private String value;

    /**
     * Timestamp of the last update of this record.
     * Automatically managed by the database.
     */
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Timestamp updatedAt;

    /**
     * Creates a new UserSetting for a given user, key and value.
     *
     * @param user       the user to whom this setting belongs
     * @param settingKey the key of the setting
     * @param value      the value of the setting
     */
    public UserSetting(User user, String settingKey, String value) {
        this.id = new UserSettingId();
        this.id.setUserId(user.getUserId());
        this.id.setSettingKey(settingKey);
        this.user = user;
        this.value = value;
    }
}
