package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.dto.AdminExportTaskDTO;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.export.AdminDataExportService;
import de.tum.cit.aet.core.service.export.admin.AdminExportTask;
import de.tum.cit.aet.core.service.export.admin.ExportManifest;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST endpoints powering the admin "Bulk Exports" page. Builds run as
 * background tasks (see {@link AdminDataExportService}) and the client polls
 * for status until the file is ready, then downloads it as a normal HTTP file
 * transfer:
 *
 * <ul>
 *   <li>{@code POST /api/admin/exports/{type}} — start a new export, returns the
 *       task id and initial {@code IN_PROGRESS} state.</li>
 *   <li>{@code GET /api/admin/exports/status/{taskId}} — poll for current status
 *       and live progress counts.</li>
 *   <li>{@code GET /api/admin/exports/download/{taskId}} — stream the built ZIP
 *       once the task is {@code READY}.</li>
 * </ul>
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/exports")
@Admin
public class AdminExportResource {

    private final AdminDataExportService adminDataExportService;
    private final CurrentUserService currentUserService;

    /**
     * Schedules an admin export of the requested type to run in the background
     * and returns the freshly created task. The client should immediately start
     * polling {@link #getStatus} with the returned task id.
     *
     * @param type which kind of admin export to produce
     * @return HTTP 202 with the new task in {@code IN_PROGRESS} state
     */
    @PostMapping("/{type}")
    public ResponseEntity<AdminExportTaskDTO> startExport(@PathVariable AdminExportType type) {
        UUID adminId = currentUserService.getUserId();
        log.info("POST /api/admin/exports/{} - Queueing admin bulk export (requested by {})", type, adminId);
        try {
            AdminExportTask task = adminDataExportService.startExport(type, adminId);
            return ResponseEntity.accepted().body(toDto(task));
        } catch (AdminDataExportService.ExportAlreadyRunningException e) {
            // Another export is already running for this admin — return 409
            // with the existing task so the client can resume polling it
            // instead of kicking off a duplicate build.
            return ResponseEntity.status(HttpStatus.CONFLICT).body(toDto(e.existing()));
        }
    }

    /**
     * Returns every admin export task the current user has in flight
     * (including already-ready ones that haven't been downloaded / expired
     * yet). Used by the frontend to hydrate its UI after a page refresh —
     * the browser-side task id is lost on reload, but the server-side task
     * is still tracked here.
     *
     * @return HTTP 200 with a newest-first list of tasks for the current admin
     */
    @GetMapping("/mine")
    public ResponseEntity<List<AdminExportTaskDTO>> listMine() {
        UUID adminId = currentUserService.getUserId();
        List<AdminExportTaskDTO> dtos = adminDataExportService.listTasksFor(adminId).stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Returns the current state of an admin export task. The client polls this
     * endpoint while the build runs in the background.
     *
     * @param taskId the task id returned from {@link #startExport}
     * @return HTTP 200 with the task snapshot, or 404 if the task is unknown / expired
     */
    @GetMapping("/status/{taskId}")
    public ResponseEntity<AdminExportTaskDTO> getStatus(@PathVariable UUID taskId) {
        AdminExportTask task = adminDataExportService.getTask(taskId);
        if (task == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toDto(task));
    }

    /**
     * Streams the built ZIP for the given task back to the client. Returns 404
     * if the task does not exist (or its file has been cleaned up) and 409 if
     * the task exists but is not yet {@code READY}.
     *
     * @param taskId the task id returned from {@link #startExport}
     * @return the ZIP file as a streamed download, or an error status
     */
    @GetMapping("/download/{taskId}")
    @ApiResponse(
        responseCode = "200",
        description = "ZIP archive containing the built admin export",
        content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE, schema = @Schema(type = "string", format = "binary"))
    )
    public ResponseEntity<Resource> download(@PathVariable UUID taskId) {
        AdminExportTask task = adminDataExportService.getTask(taskId);
        if (task == null) {
            return ResponseEntity.notFound().build();
        }
        if (task.status() == AdminExportTask.Status.IN_PROGRESS) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        Path path = adminDataExportService.getDownloadPath(taskId);
        if (path == null) {
            return ResponseEntity.notFound().build();
        }
        long size;
        try {
            size = Files.size(path);
        } catch (IOException e) {
            log.warn("Failed to stat admin export file {}: {}", path, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        String filename = adminDataExportService.fileNameFor(task.type());
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentLength(size)
            .body(new FileSystemResource(path));
    }

    /**
     * Maps a live {@link AdminExportTask} (service layer) to its wire
     * {@link AdminExportTaskDTO} (dto layer). The controller owns this
     * conversion because it is the only place that is allowed to depend on
     * both layers — keeping it out of the dto keeps the layered-architecture
     * test happy. Reads the manifest via {@link ExportManifest#snapshot()}
     * which is safe to call while the build is still running on another
     * thread.
     */
    private AdminExportTaskDTO toDto(AdminExportTask task) {
        ExportManifest.Payload p = task.manifest().snapshot();
        ExportManifest.Totals t = p.totals();
        return new AdminExportTaskDTO(
            task.taskId(),
            task.type(),
            mapStatus(task.status()),
            task.createdAt(),
            task.finishedAt(),
            p.durationSeconds(),
            task.error(),
            counts(t.researchGroups()),
            counts(t.jobs()),
            counts(t.applications()),
            counts(t.documents()),
            counts(t.users()),
            p.failures().size(),
            task.isReady()
        );
    }

    private static AdminExportTaskDTO.Status mapStatus(AdminExportTask.Status status) {
        return AdminExportTaskDTO.Status.valueOf(status.name());
    }

    private static AdminExportTaskDTO.Counts counts(ExportManifest.Snapshot s) {
        return new AdminExportTaskDTO.Counts(s.expected(), s.exported(), s.failed());
    }
}
