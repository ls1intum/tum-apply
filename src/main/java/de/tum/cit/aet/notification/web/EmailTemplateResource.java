package de.tum.cit.aet.notification.web;

import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.notification.dto.EmailTemplateDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.notification.service.EmailTemplateService;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email-templates")
@AllArgsConstructor
public class EmailTemplateResource {

    private final EmailTemplateService emailTemplateService;
    private final CurrentUserService currentUserService;

    /**
     * Returns the unified list of templates for the current user's research group:
     * customs first (most recently modified), then defaults loaded from resource files.
     */
    @ProfessorOrEmployee
    @GetMapping
    public ResponseEntity<List<EmailTemplateOverviewDTO>> getTemplates() {
        return ResponseEntity.ok(emailTemplateService.listMerged(currentUserService.getResearchGroupIfProfessor()));
    }

    /**
     * Retrieves a single custom email template by its ID.
     */
    @ProfessorOrEmployee
    @GetMapping("/{templateId}")
    public ResponseEntity<EmailTemplateDTO> getTemplate(@PathVariable UUID templateId) {
        return ResponseEntity.ok(emailTemplateService.getTemplate(templateId));
    }

    /**
     * Updates an existing custom template's content. EmailType is immutable.
     */
    @ProfessorOrEmployee
    @PutMapping
    public ResponseEntity<EmailTemplateDTO> updateTemplate(@RequestBody EmailTemplateDTO emailTemplateDTO) {
        return ResponseEntity.ok(emailTemplateService.updateTemplate(emailTemplateDTO));
    }

    /**
     * Creates a new custom template for the current user's research group.
     * Returns 409 Conflict if a custom already exists for the (group, emailType) pair.
     */
    @ProfessorOrEmployee
    @PostMapping
    public ResponseEntity<EmailTemplateDTO> createTemplate(@RequestBody EmailTemplateDTO emailTemplateDTO) {
        EmailTemplateDTO created = emailTemplateService.createTemplate(
            emailTemplateDTO,
            currentUserService.getResearchGroupIfProfessor(),
            currentUserService.getUser()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Deletes a custom template. The system default reappears in the list automatically.
     */
    @Professor
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID templateId) {
        emailTemplateService.deleteTemplate(templateId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
