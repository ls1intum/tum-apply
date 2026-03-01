package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Abstract base class for all image types using Single Table Inheritance.
 * Subclasses:
 * - ResearchGroupImage: JOB_BANNER images shared within a research group
 * - DepartmentImage: DEFAULT_JOB_BANNER images shared within a department
 * - ProfileImage: PROFILE_PICTURE images belonging to individual users
 */
@Entity
@NoUserDataExportRequired(reason = "Images are exported as binary files by UserExportZipWriter")
@Getter
@Setter
@Table(name = "images")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "image_type", discriminatorType = DiscriminatorType.STRING)
public abstract class Image extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "image_id", nullable = false)
    private UUID imageId;

    /**
     * Access URL for the image (e.g., "/images/jobs/abc-123.jpg")
     */
    @Column(name = "url", length = 512, nullable = false)
    private String url;

    @Column(name = "mime_type", length = 128, nullable = false)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
}
