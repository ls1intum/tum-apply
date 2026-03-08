package de.tum.cit.aet.core.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DataExportState;
import de.tum.cit.aet.core.domain.export.NoUserDataExportRequired;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Entity
@NoUserDataExportRequired(reason = "Operational metadata for export workflow, not part of exported user payload")
@Getter
@Setter
@Table(name = "data_export_requests")
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class DataExportRequest extends AbstractAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "export_request_id", nullable = false, updatable = false)
    private UUID exportRequestId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DataExportState status;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "download_token")
    private String downloadToken;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "last_requested_at")
    private LocalDateTime lastRequestedAt;

    @Column(name = "file_path")
    private String filePath;
}
