package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.AdminExportType;
import java.time.Instant;
import java.util.UUID;

/**
 * Wire shape returned by the admin export start / status / list endpoints.
 * Carries the task id, current lifecycle status, manifest progress counts and
 * any failure reason. The frontend uses this to drive the polling UI: while
 * {@code status == IN_PROGRESS} it shows live counts; when {@code status}
 * flips to {@code READY} it triggers the download.
 *
 * <p>This record is intentionally a pure data shape: it has no references to
 * service-layer types so it stays inside the {@code dto} layer (see the
 * layered-architecture rules in {@code TechnicalStructureTest}). The
 * conversion from {@code AdminExportTask} → {@code AdminExportTaskDTO} lives
 * in the controller, which is allowed to touch both layers.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminExportTaskDTO(
    UUID taskId,
    AdminExportType type,
    Status status,
    Instant createdAt,
    Instant finishedAt,
    Double durationSeconds,
    String error,
    Counts researchGroups,
    Counts jobs,
    Counts applications,
    Counts documents,
    Counts users,
    Counts schools,
    Counts departments,
    Counts userResearchGroupRoles,
    Counts applicants,
    Counts applicantSubjectAreaSubscriptions,
    int totalFailures,
    boolean downloadAvailable
) {
    /**
     * Mirror of {@code AdminExportTask.Status} kept in the dto layer so the
     * DTO does not import from the service layer. The names must stay in
     * sync — the controller maps between the two by enum name.
     */
    public enum Status {
        IN_PROGRESS,
        READY,
        FAILED,
    }

    /** Per-category snapshot of expected vs. exported vs. failed entity counts. */
    public record Counts(int expected, int exported, int failed) {}
}
