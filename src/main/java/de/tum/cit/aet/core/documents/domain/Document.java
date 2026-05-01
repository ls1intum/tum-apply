package de.tum.cit.aet.core.documents.domain;

import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Abstract base class for all document types using Single Table Inheritance.
 *
 * <p>Subclasses:</p>
 * <ul>
 *   <li>{@link ApplicantDocument}: documents owned by an applicant's profile (CV, transcripts, references)</li>
 *   <li>{@link ApplicationDocument}: snapshot copies of applicant documents attached to a specific application</li>
 * </ul>
 *
 * <p>This is the v2 model. Once {@code de.tum.cit.aet.core.domain.Document} and the legacy
 * {@code DocumentDictionary} are removed, this class is renamed and remapped to the {@code documents} table.</p>
 */
@Entity(name = "DocumentNew")
@NoUserDataExportRequired(reason = "Documents are exported as binary files by UserExportZipWriter")
@Getter
@Setter
@Table(name = "documents_v2")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "doc_owner_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Document extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @ManyToOne
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;
}
