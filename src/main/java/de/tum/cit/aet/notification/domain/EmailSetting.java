package de.tum.cit.aet.notification.domain;

import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "email_settings", uniqueConstraints = { @UniqueConstraint(columnNames = { "user", "email_type" }) })
public class EmailSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "email_setting_id", nullable = false, updatable = false)
    private UUID emailSettingId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "email_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EmailType emailType;

    @Column(nullable = false)
    private boolean enabled;
}
