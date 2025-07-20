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

    /**
     * Retrieves email notification settings for the currently authenticated user.
     * Returns all available email types and their current enabled/disabled status.
     *
     * @return ResponseEntity containing a set of EmailSettingDTO objects with the user's current email preferences
     */
    @GetMapping
    public ResponseEntity<Set<EmailSettingDTO>> getEmailSettings() {
        return ResponseEntity.ok(emailSettingService.getSettingsForUser(currentUserService.getUser()));
    }

    /**
     * Updates email notification settings for the currently authenticated user.
     * Allows users to enable or disable specific email notification types based on their role permissions.
     *
     * @param emailSettingDTOs a set of EmailSettingDTO objects containing the updated email preferences
     * @return ResponseEntity containing the updated set of EmailSettingDTO objects after successful persistence
     */
    @PutMapping
    public ResponseEntity<Set<EmailSettingDTO>> updateEmailSettings(@RequestBody Set<EmailSettingDTO> emailSettingDTOs) {
        return ResponseEntity.ok(emailSettingService.updateSettingsForUser(emailSettingDTOs, currentUserService.getUser()));
    }
}
