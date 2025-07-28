package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "email_templates",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_email_template_name_group_type",
        columnNames = { "template_name", "research_group_id", "email_type" }
    )
)
@Getter
@Setter
public class EmailTemplate extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "email_template_id", nullable = false, updatable = false)
    private UUID emailTemplateId;

    @Column(name = "template_name", nullable = false)
    private String templateName;

    @ManyToOne
    @JoinColumn(name = "research_group_id", nullable = false)
    private ResearchGroup researchGroup;

    @Column(name = "email_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EmailType emailType;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @OneToMany(mappedBy = "emailTemplate", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<EmailTemplateTranslation> translations = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
}
