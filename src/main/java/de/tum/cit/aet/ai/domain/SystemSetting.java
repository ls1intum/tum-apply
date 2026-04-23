package de.tum.cit.aet.ai.domain;

import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a system-wide configuration setting.
 * Each setting is uniquely identified by its key.
 */
@Getter
@Setter
@Entity
@Table(name = "system_settings")
@NoArgsConstructor
@NoUserDataExportRequired(reason = "System configuration settings are not part of user-personal export scope")
public class SystemSetting {

    @Id
    @Column(name = "setting_key", nullable = false)
    private String key;

    @Column(name = "setting_value", length = 1000)
    private String value;

    public SystemSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }
}
