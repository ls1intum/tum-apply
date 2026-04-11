package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.service.export.admin.AdminExportTask;
import de.tum.cit.aet.core.service.export.admin.ExportManifest;
import java.time.Instant;
import java.util.UUID;

/**
 * Wire shape returned by the admin export status / start endpoints. Carries
 * the task id, current lifecycle status, manifest progress counts and any
 * failure reason. The frontend uses this to drive the polling UI: while
 * {@code status == IN_PROGRESS} it shows live counts; when {@code status}
 * flips to {@code READY} it triggers the download.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminExportTaskDTO(
    UUID taskId,
    AdminExportType type,
    AdminExportTask.Status status,
    Instant createdAt,
    Instant finishedAt,
    Double durationSeconds,
    String error,
    Counts researchGroups,
    Counts jobs,
    Counts applications,
    Counts documents,
    Counts users,
    int totalFailures,
    boolean downloadAvailable
) {
    /** Per-category snapshot of expected vs. exported vs. failed entity counts. */
    public record Counts(int expected, int exported, int failed) {}

    /**
     * Builds the wire DTO from a live task. Reads the manifest via
     * {@link ExportManifest#snapshot()} so it is safe to call from a polling
     * thread while the build is still running on the task executor.
     *
     * @param task the live task; never {@code null}
     * @return a frozen snapshot of the task suitable for HTTP responses
     */
    public static AdminExportTaskDTO from(AdminExportTask task) {
        ExportManifest.Payload p = task.manifest().snapshot();
        return new AdminExportTaskDTO(
            task.taskId(),
            task.type(),
            task.status(),
            task.createdAt(),
            task.finishedAt(),
            p.durationSeconds(),
            task.error(),
            counts(p.totals().researchGroups()),
            counts(p.totals().jobs()),
            counts(p.totals().applications()),
            counts(p.totals().documents()),
            counts(p.totals().users()),
            p.failures().size(),
            task.isReady()
        );
    }

    private static Counts counts(ExportManifest.Snapshot s) {
        return new Counts(s.expected(), s.exported(), s.failed());
    }
}
