package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.UserDataExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserDataExportResource {

    private final UserDataExportService userDataExportService;
    private final CurrentUserService currentUserService;

    @Authenticated
    @GetMapping(path = "/export", produces = "application/zip")
    @Operation(
        summary = "Export user data",
        responses = {
            @ApiResponse(
                responseCode = "200",
                content = @Content(mediaType = "application/zip", schema = @Schema(type = "string", format = "binary"))
            ),
            @ApiResponse(responseCode = "500"),
        }
    )
    public void exportUserData(HttpServletResponse response) {
        try {
            UUID currentUserId = currentUserService.getUserId();
            userDataExportService.exportUserData(currentUserId, response);
        } catch (Exception e) {
            log.error("User data export failed", e);
            throw new UserDataExportException("User data export failed", e);
        }
    }
}
