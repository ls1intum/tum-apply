package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "documents")
public class Document extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private DocumentType type;

    @Column(name = "document_path")
    private String documentPath;

    @ManyToOne
    @JoinColumn(name = "custom_field_answer_id")
    private CustomFieldAnswer customFieldAnswer;

    @ManyToOne
    @JoinColumn(name = "application_id")
    private Application application;
}
