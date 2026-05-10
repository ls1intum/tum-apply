package de.tum.cit.aet.reference.domain;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.domain.AbstractAuditingEntity;
import de.tum.cit.aet.core.domain.export.ExportedUserData;
import de.tum.cit.aet.core.domain.export.UserDataExportProviderType;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A request the applicant sends to an external referee asking them to upload a recommendation letter.
 */
@Getter
@Setter
@Entity
@ExportedUserData(by = UserDataExportProviderType.APPLICANT)
@Table(name = "reference_requests")
public class ReferenceRequest extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "reference_request_id", nullable = false)
    private UUID referenceRequestId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "title")
    private String title;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "token_hash")
    private String tokenHash;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReferenceRequestStatus status = ReferenceRequestStatus.REQUESTED;

    @Column(name = "last_reminder_at")
    private LocalDateTime lastReminderAt;

    @Column(name = "reminder_count", nullable = false)
    private int reminderCount = 0;

    /**
     * FK to the {@code documents} row holding the uploaded recommendation letter.
     * {@code null} until the referee submits a PDF; resolved through {@code DocumentService}.
     */
    @Column(name = "document_id")
    private UUID documentId;
}
