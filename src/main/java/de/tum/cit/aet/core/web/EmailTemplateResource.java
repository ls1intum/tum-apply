package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.EmailTemplateDTO;
import de.tum.cit.aet.core.dto.EmailTemplateGroupDTO;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/email-templates")
@AllArgsConstructor
public class EmailTemplateResource {

    private final EmailTemplateService emailTemplateService;
    private final CurrentUserService currentUserService;

    @GetMapping("/overview")
    public ResponseEntity<List<EmailTemplateGroupDTO>> getGroupedTemplate(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        return ResponseEntity.ok(emailTemplateService.getGroupedTemplates(currentUserService.getResearchGroupIfProfessor(), pageDTO));
    }

    @GetMapping
    public ResponseEntity<EmailTemplateDTO> getTemplate(@RequestParam UUID templateId) {
        return ResponseEntity.ok(
            emailTemplateService.getTemplate(templateId)
        );
    }

    @PutMapping
    public ResponseEntity<EmailTemplateDTO> updateTemplate(@RequestBody EmailTemplateDTO emailTemplateDTO) {
        return ResponseEntity.ok(emailTemplateService.updateTemplate(emailTemplateDTO));
    }

    @PostMapping
    ResponseEntity<EmailTemplateDTO> createTemplate(@RequestBody EmailTemplateDTO emailTemplateDTO) {
        EmailTemplateDTO createdTemplates = emailTemplateService.createTemplates(
            emailTemplateDTO,
            currentUserService.getResearchGroupIfProfessor(),
            currentUserService.getUser()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(createdTemplates);
    }

    @DeleteMapping
    ResponseEntity<Void> deleteTemplate(@RequestParam UUID templateId) {
        emailTemplateService.deleteTemplate(templateId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
