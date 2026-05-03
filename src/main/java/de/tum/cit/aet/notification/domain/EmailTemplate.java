package de.tum.cit.aet.notification.domain;

import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@NoUserDataExportRequired(reason = "System template configuration is not user-personal export data")
@Table(
    name = "email_templates",
    uniqueConstraints = @UniqueConstraint(name = "uk_email_templates_group_type", columnNames = { "research_group_id", "email_type" })
)
@Getter
@Setter
public class EmailTemplate extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "email_template_id", nullable = false, updatable = false)
    private UUID emailTemplateId;

    @ManyToOne
    @JoinColumn(name = "research_group_id", nullable = false)
    private ResearchGroup researchGroup;

    @Column(name = "email_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EmailType emailType;

    @Column(name = "subject_en", nullable = false, columnDefinition = "TEXT")
    private String subjectEn;

    @Column(name = "body_html_en", nullable = false, columnDefinition = "TEXT")
    private String bodyHtmlEn;

    @Column(name = "subject_de", nullable = false, columnDefinition = "TEXT")
    private String subjectDe;

    @Column(name = "body_html_de", nullable = false, columnDefinition = "TEXT")
    private String bodyHtmlDe;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
}
