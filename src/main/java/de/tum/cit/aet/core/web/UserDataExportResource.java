package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.UserDataExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
