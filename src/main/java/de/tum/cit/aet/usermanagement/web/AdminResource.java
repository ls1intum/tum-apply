package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupProvisionDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Provides administrative endpoints for managing research groups.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminResource {

    private final ResearchGroupService researchGroupService;

    /**
     * Provisions a new research group, potentially including additional setup steps.
     *
     * @param request the DTO containing the information required to provision a research group
     * @return HTTP 200 OK with the provisioned {@link ResearchGroup}
     */
    @PostMapping("/research-groups/provision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResearchGroup> provisionResearchGroup(@Valid @RequestBody ResearchGroupProvisionDTO request) {
        return ResponseEntity.ok(researchGroupService.provisionResearchGroup(request));
    }
}
