package de.tum.cit.aet.usermanagement.web;

import java.util.UUID;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupCreationDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;

@RestController
@RequestMapping("/api/research-groups")
public class ResearchGroupResource {

    final ResearchGroupService researchGroupService;

    public ResearchGroupResource(ResearchGroupService researchGroupService) {
        this.researchGroupService = researchGroupService;
    }

    @GetMapping("/detail/{researchGroupId}")
    public ResponseEntity<ResearchGroupLargeDTO> getResourceGroupDetails(@PathVariable UUID researchGroupId) {
        return ResponseEntity.ok(researchGroupService.getResearchGroupDetails(researchGroupId));
    }

    @PostMapping("/admin/researchGroup/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResearchGroup> createResearchGroup(@Valid @RequestBody ResearchGroupCreationDTO researchGroupCreationDTO) {
        return ResponseEntity.ok(researchGroupService.createResearchGroup(researchGroupCreationDTO));
    }
}
