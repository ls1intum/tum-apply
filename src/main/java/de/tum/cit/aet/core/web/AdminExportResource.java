package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.export.AdminDataExportService;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

/**
 * REST endpoint powering the admin "Bulk Exports" page. A single POST per type
 * builds the ZIP and streams it back to the browser as a download. The
 * controller returns a {@link StreamingResponseBody} so the binary contract
 * is described in the OpenAPI spec (and the generated Angular client gets a
 * proper {@code Observable<HttpResponse<Blob>>}), while the underlying ZIP is
 * still streamed without buffering it into memory.
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
     * Builds an admin export of the requested type and streams the produced ZIP
     * directly to the response body. The browser handles the resulting
     * {@code attachment} disposition as a regular file download.
     *
     * @param type which kind of admin export to produce
     * @return a streaming response body that emits the ZIP bytes
     */
    @PostMapping(value = "/{type}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @ApiResponse(
        responseCode = "200",
        description = "ZIP archive containing the requested admin export",
        content = @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM_VALUE, schema = @Schema(type = "string", format = "binary"))
    )
    public ResponseEntity<StreamingResponseBody> download(@PathVariable AdminExportType type) {
        UUID adminId = currentUserService.getUserId();
        log.info("POST /api/admin/exports/{} - Building admin bulk export (requested by {})", type, adminId);

        String filename = adminDataExportService.fileNameFor(type);
        StreamingResponseBody body = out -> {
            adminDataExportService.buildExport(type, out);
            out.flush();
        };

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .body(body);
    }
}
