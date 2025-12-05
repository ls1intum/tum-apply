package de.tum.cit.aet.notification.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.security.annotations.Professor;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployee;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.notification.dto.EmailTemplateDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.notification.service.EmailTemplateService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
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
     * Returns a paginated list of email templates for the current user's research group.
     *
     * @param pageDTO pagination parameters including page number and size
     * @return a list of {@link EmailTemplateOverviewDTO} wrapped in a {@link ResponseEntity}
     */
    @ProfessorOrEmployee
    @GetMapping
    public ResponseEntity<PageResponseDTO<EmailTemplateOverviewDTO>> getTemplates(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        return ResponseEntity.ok(emailTemplateService.getTemplates(currentUserService.getResearchGroupIfProfessor(), pageDTO));
    }

    /**
     * Retrieves a single email template by its ID.
     *
     * @param templateId the ID of the template to retrieve
     * @return the full {@link EmailTemplateDTO} wrapped in a {@link ResponseEntity}
     */
    @ProfessorOrEmployee
    @GetMapping("/{templateId}")
    public ResponseEntity<EmailTemplateDTO> getTemplate(@PathVariable UUID templateId) {
        return ResponseEntity.ok(emailTemplateService.getTemplate(templateId));
    }

    /**
     * Updates an existing email template.
     *
     * @param emailTemplateDTO the updated template data
     * @return the updated {@link EmailTemplateDTO} wrapped in a {@link ResponseEntity}
     */
    @ProfessorOrEmployee
    @PutMapping
    public ResponseEntity<EmailTemplateDTO> updateTemplate(@RequestBody EmailTemplateDTO emailTemplateDTO) {
        return ResponseEntity.ok(emailTemplateService.updateTemplate(emailTemplateDTO));
    }

    /**
     * Creates a new email template for the current user's research group.
     *
     * @param emailTemplateDTO the template data to create
     * @return the created {@link EmailTemplateDTO} wrapped in a {@link ResponseEntity} with status 201 (Created)
     */
    @ProfessorOrEmployee
    @PostMapping
    public ResponseEntity<EmailTemplateDTO> createTemplate(@RequestBody EmailTemplateDTO emailTemplateDTO) {
        EmailTemplateDTO createdTemplates = emailTemplateService.createTemplate(
            emailTemplateDTO,
            currentUserService.getResearchGroupIfProfessor(),
            currentUserService.getUser()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(createdTemplates);
    }

    /**
     * Deletes an existing email template by its ID.
     *
     * @param templateId the ID of the template to delete
     * @return an empty {@link ResponseEntity} with status 204 (No Content)
     */
    @Professor
    @DeleteMapping("/{templateId}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID templateId) {
        emailTemplateService.deleteTemplate(templateId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
