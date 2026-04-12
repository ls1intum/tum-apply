package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.dto.AdminExportTaskDTO;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.export.AdminDataExportService;
import de.tum.cit.aet.core.service.export.admin.AdminExportTask;
import de.tum.cit.aet.core.service.export.admin.ExportManifest;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
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
     * <p>Supports HTTP {@code Range} requests (RFC 7233) so the frontend can
     * download the ZIP in smaller chunks instead of a single multi-minute
     * request. This matters for large admin exports (~GB scale): a single
     * long-lived HTTP response can hit nginx's {@code proxy_max_temp_file_size}
     * (default 1 GB), proxy read timeouts, or client-side memory limits.
     * Chunked range requests sidestep all of these — each chunk is a fresh
     * request that finishes quickly.
     *
     * <p>The bytes are written straight to the {@link HttpServletResponse}
     * output stream rather than returned as a {@link ResponseEntity} body.
     * Spring's {@code HttpMessageConverter} lookup for {@code ResponseEntity<?>}
     * resolves the generic parameter to {@code Object.class}, which
     * {@code ResourceRegionHttpMessageConverter.canWrite(Type, Class, MediaType)}
     * rejects (its declared-type check needs {@code ResourceRegion.class}
     * assignable from the argument, but {@code Object.class} is not). The
     * result was a {@code HttpMessageNotWritableException} on every range
     * request. Writing directly to the servlet response bypasses message
     * converters entirely and keeps the endpoint fully RFC 7233 compliant:
     * {@code 206 Partial Content} with {@code Content-Range} only for
     * range requests, {@code 200 OK} with just {@code Content-Length} for
     * full downloads.
     *
     * @param taskId      the task id returned from {@link #startExport}
     * @param rangeHeader optional HTTP {@code Range} header value
     * @param response    the servlet response; bytes are written directly to it
     */
    @GetMapping("/download/{taskId}")
    public void download(
        @PathVariable UUID taskId,
        @Parameter(hidden = true) @RequestHeader(value = "Range", required = false) String rangeHeader,
        HttpServletResponse response
    ) throws IOException {
        AdminExportTask task = adminDataExportService.getTask(taskId);
        if (task == null) {
            response.setStatus(HttpStatus.NOT_FOUND.value());
            return;
        }
        if (task.status() == AdminExportTask.Status.IN_PROGRESS) {
            response.setStatus(HttpStatus.CONFLICT.value());
            return;
        }
        Path path = adminDataExportService.getDownloadPath(taskId);
        if (path == null) {
            response.setStatus(HttpStatus.NOT_FOUND.value());
            return;
        }
        long contentLength;
        try {
            contentLength = Files.size(path);
        } catch (IOException e) {
            log.warn("Failed to stat admin export file {}: {}", path, e.getMessage());
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            return;
        }
        String filename = adminDataExportService.fileNameFor(task.type());

        // Parse Range header. We only honour a single byte range — multi-part
        // responses add complexity the frontend never needs.
        long start = 0;
        long end = contentLength - 1;
        boolean partial = false;
        if (rangeHeader != null && !rangeHeader.isBlank()) {
            try {
                List<HttpRange> ranges = HttpRange.parseRanges(rangeHeader);
                if (!ranges.isEmpty()) {
                    HttpRange range = ranges.getFirst();
                    start = range.getRangeStart(contentLength);
                    end = range.getRangeEnd(contentLength);
                    partial = true;
                }
            } catch (IllegalArgumentException e) {
                // Malformed or unsatisfiable range — RFC 7233 §4.4 says reply
                // with 416 and a Content-Range that states the full file size.
                response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
                response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + contentLength);
                return;
            }
        }
        long bytesToWrite = end - start + 1;

        response.setStatus(partial ? HttpStatus.PARTIAL_CONTENT.value() : HttpStatus.OK.value());
        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        response.setHeader(HttpHeaders.CONTENT_LENGTH, Long.toString(bytesToWrite));
        if (partial) {
            response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + contentLength);
        }

        try (InputStream in = Files.newInputStream(path); OutputStream out = response.getOutputStream()) {
            // Skip to the start of the requested range. InputStream.skip can
            // return fewer bytes than requested, so loop until we've reached
            // the offset or skip stops making progress.
            long skipped = 0;
            while (skipped < start) {
                long s = in.skip(start - skipped);
                if (s <= 0) {
                    break;
                }
                skipped += s;
            }
            byte[] buffer = new byte[8192];
            long remaining = bytesToWrite;
            while (remaining > 0) {
                int toRead = (int) Math.min(buffer.length, remaining);
                int read = in.read(buffer, 0, toRead);
                if (read == -1) {
                    break;
                }
                out.write(buffer, 0, read);
                remaining -= read;
            }
            out.flush();
        }
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
            counts(t.schools()),
            counts(t.departments()),
            counts(t.userResearchGroupRoles()),
            counts(t.applicants()),
            counts(t.applicantSubjectAreaSubscriptions()),
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
