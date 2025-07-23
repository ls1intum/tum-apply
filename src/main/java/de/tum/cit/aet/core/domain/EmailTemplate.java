package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "email_templates")
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

    @Column(name = "template_name")
    private String templateName; // relevant for APPLICATION_ACCEPTED

    @Column(name = "language", nullable = false)
    @Enumerated(EnumType.STRING)
    private Language language;

    @Column(name = "email_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EmailType emailType;

    @Column(name = "email_case") // only for rejection
    private String emailCase;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "body_html", nullable = false)
    private String bodyHtml;

    @Column(name = "is_default")
    private boolean isDefault; // relevant for accepted only

    @ManyToOne
    @JoinColumn(name = "last_modified_by")
    private User lastModifiedBy;
}
