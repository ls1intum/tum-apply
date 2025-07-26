package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.dto.EmailTemplateDTO;
import de.tum.cit.aet.core.dto.EmailTemplateGroupDTO;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.EmailTemplateService;
import jakarta.validation.Valid;
import java.util.List;
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

    @GetMapping("/overview")
    public ResponseEntity<List<EmailTemplateGroupDTO>> getGroupedTemplates(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        return ResponseEntity.ok(emailTemplateService.getGroupedTemplates(currentUserService.getResearchGroupIfProfessor(), pageDTO));
    }

    @GetMapping
    public ResponseEntity<List<EmailTemplateDTO>> getTemplates(
        @RequestParam EmailType emailType,
        @RequestParam(required = false) String templateName
    ) {
        return ResponseEntity.ok(
            emailTemplateService.getTemplates(emailType, templateName, currentUserService.getResearchGroupIfProfessor())
        );
    }

    @PutMapping
    public ResponseEntity<List<EmailTemplateDTO>> updateTemplates(@RequestBody List<EmailTemplateDTO> emailTemplateDTOs) {
        return ResponseEntity.ok(emailTemplateService.updateTemplates(emailTemplateDTOs));
    }

    @PostMapping
    ResponseEntity<List<EmailTemplateDTO>> createTemplates(@RequestBody List<EmailTemplateDTO> emailTemplateDTOs) {
        List<EmailTemplateDTO> createdTemplates = emailTemplateService.createTemplates(
            emailTemplateDTOs,
            currentUserService.getResearchGroupIfProfessor(),
            currentUserService.getUser()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(createdTemplates);
    }

    @DeleteMapping
    ResponseEntity<Void> deleteTemplate(@RequestParam EmailType emailType, @RequestParam(required = false) String templateName) {
        emailTemplateService.deleteTemplates(emailType, templateName, currentUserService.getResearchGroupIfProfessor());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
