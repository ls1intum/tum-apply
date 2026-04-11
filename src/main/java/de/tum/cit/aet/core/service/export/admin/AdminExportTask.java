package de.tum.cit.aet.core.service.export.admin;

import de.tum.cit.aet.core.constants.AdminExportType;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;

/**
 * In-memory state holder for one admin bulk export run. Created when the
 * client POSTs to start an export, mutated by the background build worker as
 * it makes progress, and read by the polling endpoint until the file is
 * downloaded or the TTL expires.
 *
 * <p>Lifecycle:
 * <pre>
 *   created → IN_PROGRESS (immediately, build runs on TaskExecutor)
 *           → READY (file written to disk, downloadable)
 *           → FAILED (build threw, error message captured, file deleted)
 * </pre>
 *
 * <p>Mutable fields ({@code status}, {@code error}, {@code finishedAt}) are
 * {@code volatile} so the polling thread sees the latest values without
 * locking. The embedded {@link ExportManifest} is mutated by the build thread;
 * polling reads it via {@link ExportManifest#snapshot()} which is non-mutating.
 */
public final class AdminExportTask {

    public enum Status {
        IN_PROGRESS,
        READY,
        FAILED,
    }

    private final UUID taskId;
    private final AdminExportType type;
    private final UUID requestedBy;
    private final Instant createdAt;
    private final Path file;
    private final ExportManifest manifest;

    private volatile Status status;
    private volatile String error;
    private volatile Instant finishedAt;

    public AdminExportTask(UUID taskId, AdminExportType type, UUID requestedBy, Path file) {
        this.taskId = taskId;
        this.type = type;
        this.requestedBy = requestedBy;
        this.createdAt = Instant.now();
        this.file = file;
        this.manifest = new ExportManifest(type, requestedBy);
        this.status = Status.IN_PROGRESS;
    }

    public UUID taskId() {
        return taskId;
    }

    public AdminExportType type() {
        return type;
    }

    public UUID requestedBy() {
        return requestedBy;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Path file() {
        return file;
    }

    public ExportManifest manifest() {
        return manifest;
    }

    public Status status() {
        return status;
    }

    public String error() {
        return error;
    }

    public Instant finishedAt() {
        return finishedAt;
    }

    /** Marks the task as ready: the file on disk is complete and downloadable. */
    public void markReady() {
        this.finishedAt = Instant.now();
        this.status = Status.READY;
    }

    /**
     * Marks the task as failed and records the cause.
     *
     * @param reason short message describing the failure (typically the exception's message)
     */
    public void markFailed(String reason) {
        this.finishedAt = Instant.now();
        this.error = reason;
        this.status = Status.FAILED;
    }

    public boolean isReady() {
        return status == Status.READY;
    }
}
