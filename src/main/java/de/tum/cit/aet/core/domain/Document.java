package de.tum.cit.aet.core.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "documents")
public class Document extends AbstractAuditingEntity {

    @Id
    @Column(name = "sha256_id", length = 64)
    private String sha256Id;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "size_bates", nullable = false)
    private Long sizeBytes;
}
