package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.security.CheckAccess;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing research groups.
 */
@RestController
@RequestMapping("/api/research-groups")
@RequiredArgsConstructor
public class ResearchGroupResource {

    private final ResearchGroupService researchGroupService;

    /**
     * Get all research groups.
     *
     * @return the list of research groups
     */
    @GetMapping
    public ResponseEntity<List<ResearchGroupDTO>> getAllResearchGroups() {
        List<ResearchGroupDTO> researchGroups = researchGroupService.getAllResearchGroups();
        return ResponseEntity.ok(researchGroups);
    }

    /**
     * Get a specific research group by ID.
     *
     * @param id the ID of the research group to retrieve
     * @return the research group
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResearchGroupDTO> getResearchGroup(@PathVariable UUID id) {
        ResearchGroupDTO researchGroup = researchGroupService.getResearchGroup(id);
        return ResponseEntity.ok(researchGroup);
    }

    /**
     * Update a research group.
     *
     * @param id the ID of the research group to update
     * @param researchGroupDTO the research group data to update
     * @return the updated research group
     */
    @PutMapping("/{id}")
    @CheckAccess
    public ResponseEntity<ResearchGroupDTO> updateResearchGroup(
        @PathVariable UUID id,
        @RequestBody ResearchGroupDTO researchGroupDTO
    ) {
        ResearchGroupDTO updatedResearchGroup = researchGroupService.updateResearchGroup(id, researchGroupDTO);
        return ResponseEntity.ok(updatedResearchGroup);
    }
}