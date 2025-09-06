package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/research-groups")
public class ResearchGroupResource {

    private final ResearchGroupService researchGroupService;

    public ResearchGroupResource(ResearchGroupService researchGroupService) {
        this.researchGroupService = researchGroupService;
    }

    /**
     * Returns all members of the current user's research group.
     *
     * @return the list of members
     */
    @GetMapping("/members")
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserShortDTO>> getResearchGroupMembers() {
        List<UserShortDTO> members = researchGroupService.getCurrentUserResearchGroupMembers();
        return ResponseEntity.ok(members);
    }
}
