package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.EmailSettingDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.EmailSettingService;
import java.util.Set;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/emails")
@AllArgsConstructor
public class EmailSettingResource {

    private final EmailSettingService emailSettingService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<Set<EmailSettingDTO>> getEmailSettings() {
        return ResponseEntity.ok(emailSettingService.getSettingsForUser(currentUserService.getUser()));
    }

    @PutMapping
    public ResponseEntity<Set<EmailSettingDTO>> updateEmailSettings(@RequestBody Set<EmailSettingDTO> emailSettingDTOs) {
        return ResponseEntity.ok(emailSettingService.updateSettingsForUser(emailSettingDTOs, currentUserService.getUser()));
    }
}
