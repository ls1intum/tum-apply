package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.Language;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "email_template_translations",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_template_language",
        columnNames = {"email_template_id", "language"}
    )
)
@Getter
@Setter
public class EmailTemplateTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "email_template_translation_id", nullable = false, updatable = false)
    private UUID translationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "language", nullable = false)
    private Language language;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "body_html", nullable = false, columnDefinition = "TEXT")
    private String bodyHtml;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_template_id", nullable = false)
    private EmailTemplate emailTemplate;
}
