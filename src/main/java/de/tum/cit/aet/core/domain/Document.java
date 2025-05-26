package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
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

    @Column(name = "sha256_id", length = 64, unique = true)
    private String sha256Id;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bates", nullable = false)
    private Long sizeBytes;

    @ManyToOne
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;
}
