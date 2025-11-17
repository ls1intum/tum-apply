package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.constants.School;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "images")
public class Image extends AbstractAuditingEntity {

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

    /**
     * Category/type of image
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", nullable = false)
    private ImageType imageType;

    /**
     * School this image belongs to (only relevant for default images)
     * Null for user-uploaded images
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "school")
    private School school;

    @ManyToOne
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
}
