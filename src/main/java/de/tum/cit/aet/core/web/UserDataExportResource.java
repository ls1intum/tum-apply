package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.UserDataExportService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
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
    public void exportUserData(HttpServletResponse response) throws IOException {
        UUID currentUserId = currentUserService.getUserId();
        userDataExportService.exportUserData(currentUserId, response);
    }
}
