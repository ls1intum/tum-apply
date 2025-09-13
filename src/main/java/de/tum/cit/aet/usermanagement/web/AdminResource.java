package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupCreationDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminResource {

    private final ResearchGroupService researchGroupService;

    // POST /api/admin/research-groups   (create group manually)
    @PostMapping("/research-groups")
    public ResponseEntity<ResearchGroup> createResearchGroup(
        @Valid @RequestBody ResearchGroupCreationDTO request) {
        return ResponseEntity.ok(researchGroupService.createResearchGroup(request));
    }

    @PostMapping("/research-groups/provision")
    public ResponseEntity<ResearchGroup> provisionResearchGroup(
        @Valid @RequestBody ResearchGroupCreationDTO request) {
        return ResponseEntity.ok(researchGroupService.provisionResearchGroup(request));
    }

}
