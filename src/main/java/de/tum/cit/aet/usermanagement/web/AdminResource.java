package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupProvisionDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides administrative endpoints for managing research groups.
 */
@RestController
@RequestMapping("/api/admin")
@Admin
@RequiredArgsConstructor
public class AdminResource {

    private final ResearchGroupService researchGroupService;

    /**
     * Provisions a new research group, potentially including additional setup steps.
     *
     * @param request the DTO containing the information required to provision a research group
     * @return HTTP 200 OK with the provisioned {@link ResearchGroup}
     */
    @Admin
    @PostMapping("/research-groups/provision")
    public ResponseEntity<ResearchGroup> provisionResearchGroup(@Valid @RequestBody ResearchGroupProvisionDTO request) {
        return ResponseEntity.ok(researchGroupService.provisionResearchGroup(request));
    }
}
