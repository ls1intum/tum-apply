package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.DataExportStatusDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.UserDataExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.nio.file.Path;
import java.util.Objects;
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

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserDataExportResource {

    private final UserDataExportService userDataExportService;
    private final CurrentUserService currentUserService;

    /**
     * Retrieves the current data export status for the authenticated user.
     *
     * @return ResponseEntity containing the data export status
     */
    @Operation(
        summary = "Get data export status for the current user",
        responses = {
            @ApiResponse(responseCode = "200", description = "Current data export status"),
            @ApiResponse(
                responseCode = "500",
                description = "Internal server error while loading data export status",
                content = @Content(schema = @Schema(implementation = UserDataExportException.class))
            ),
        }
    )
    @GetMapping("/data-export/status")
    @Authenticated
    public ResponseEntity<DataExportStatusDTO> getDataExportStatus() {
        UUID userId = currentUserService.getUserId();
        return ResponseEntity.ok(userDataExportService.getDataExportStatus(userId));
    }

    /**
     * Initiates a data export request for the authenticated user.
     *
     * @return ResponseEntity with status ACCEPTED indicating the request was accepted
     */
    @Operation(
        summary = "Request a data export for the current user",
        responses = {
            @ApiResponse(responseCode = "202", description = "Data export request accepted"),
            @ApiResponse(responseCode = "409", description = "Data export request already exists or is in progress"),
            @ApiResponse(responseCode = "429", description = "Data export request rate limit exceeded"),
            @ApiResponse(
                responseCode = "500",
                description = "Internal server error while creating data export request",
                content = @Content(schema = @Schema(implementation = UserDataExportException.class))
            ),
        }
    )
    @PostMapping("/data-export")
    @Authenticated
    public ResponseEntity<Void> requestDataExport() {
        UUID userId = currentUserService.getUserId();
        log.info("Received data export request for user with ID: {}", userId);
        userDataExportService.initiateDataExportForUser(userId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    /**
     * Downloads the prepared data export file using the provided token.
     *
     * @param token the download token for the export
     * @return ResponseEntity containing the file resource for download
     */
    @Operation(
        summary = "Download a prepared data export",
        responses = {
            @ApiResponse(responseCode = "200", description = "Data export download"),
            @ApiResponse(responseCode = "404", description = "Export not found"),
            @ApiResponse(responseCode = "409", description = "Export not ready or expired"),
            @ApiResponse(
                responseCode = "500",
                description = "Internal server error while downloading data export",
                content = @Content(schema = @Schema(implementation = UserDataExportException.class))
            ),
        }
    )
    @GetMapping("/data-export/download/{token}")
    public ResponseEntity<Resource> downloadDataExport(@PathVariable String token) {
        Path exportPath = Objects.requireNonNull(userDataExportService.getExportPathForToken(token));
        Resource resource = new FileSystemResource(exportPath);
        String filename = exportPath.getFileName().toString();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("application/zip"))
            .body(resource);
    }
}
