package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.UserDataExportService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/export")
    public ResponseEntity<UserDataExportDTO> exportUserData() {
        UUID currentUserId = currentUserService.getUserId();
        UserDataExportDTO userData = userDataExportService.exportUserData(currentUserId);
        return ResponseEntity.ok(userData);
    }
}
