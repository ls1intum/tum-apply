package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.application.domain.CustomField;
import de.tum.cit.aet.core.domain.constants.DocumentType;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @ManyToOne
    @JoinColumn(name = "applicant_id")
    private Applicant applicant;

    private DocumentType type;

    @Column(name = "document_path")
    private String documentPath;

    @ManyToOne
    @JoinColumn(name = "custom_field_id")
    private CustomField customField;
}
