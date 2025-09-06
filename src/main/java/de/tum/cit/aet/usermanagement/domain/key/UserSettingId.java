package de.tum.cit.aet.usermanagement.domain.key;

import de.tum.cit.aet.usermanagement.domain.UserSetting;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * Composite primary key for a {@link UserSetting}.
 * Consists of a reference to the owning user and the specific setting key.
 */
@Getter
@Setter
@Embeddable
public class UserSettingId implements Serializable {

    /**
     * The UUID of the user this setting belongs to.
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * The key/name of the setting (e.g. "theme", "language").
     */
    @Column(name = "setting_key", length = 100, nullable = false)
    private String settingKey;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserSettingId that)) {
            return false;
        }
        return Objects.equals(userId, that.userId) && Objects.equals(settingKey, that.settingKey);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, settingKey);
    }
}
