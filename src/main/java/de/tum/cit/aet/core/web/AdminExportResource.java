package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.AdminExportType;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.export.AdminDataExportService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST endpoint powering the admin "Bulk Exports" page. A single POST per type
 * builds the ZIP synchronously and streams it back to the browser as a
 * download.
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
     * @param type     which kind of admin export to produce
     * @param response servlet response written to in-place
     * @throws IOException if writing to the response stream fails
     */
    @PostMapping("/{type}")
    public void download(@PathVariable AdminExportType type, HttpServletResponse response) throws IOException {
        UUID adminId = currentUserService.getUserId();
        log.info("Admin {} downloading bulk export of type {}", adminId, type);

        String filename = adminDataExportService.fileNameFor(type);
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");

        try (OutputStream out = response.getOutputStream()) {
            adminDataExportService.buildExport(type, out);
            out.flush();
        }
    }
}
