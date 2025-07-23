package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.EmailTemplateDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.TemplateService;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/email-templates")
@AllArgsConstructor
public class EmailTemplateResource {

    private final TemplateService templateService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<EmailTemplateDTO>> getAll() {
        return ResponseEntity.ok(templateService.getTemplates(currentUserService.getResearchGroupIfProfessor()));
    }
}
