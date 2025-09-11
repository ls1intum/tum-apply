package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.core.security.CheckAccess;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import jakarta.validation.Valid;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/research-groups")
public class ResearchGroupResource {

    private final ResearchGroupService researchGroupService;

    public ResearchGroupResource(ResearchGroupService researchGroupService) {
        this.researchGroupService = researchGroupService;
    }

    /**
     * Returns paginated members of the current user's research group.
     *
     * @return paginated list of members
     */
    @GetMapping("/members")
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    public ResponseEntity<PageResponseDTO<UserShortDTO>> getResearchGroupMembers(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        PageResponseDTO<UserShortDTO> members = researchGroupService.getCurrentUserResearchGroupMembers(pageDTO);
        return ResponseEntity.ok(members);
    }

    /**
     * Searches for users that are not yet members of any research group.
     *
     * @param query the search query string
     * @return the list of available users matching the search criteria
     */
    @GetMapping("/search-available-users")
    @PreAuthorize("hasRole('PROFESSOR') or hasRole('ADMIN')")
    public ResponseEntity<List<UserShortDTO>> searchAvailableUsers(@RequestParam String query) {
        List<UserShortDTO> availableUsers = researchGroupService.searchAvailableUsers(query);
        return ResponseEntity.ok(availableUsers);
    }

    /**
     * Retrieves the details of a research group by its ID.
     *
     * @param researchGroupId the unique identifier of the research group
     * @return the research group details
     */
    @GetMapping("/detail/{researchGroupId}")
    public ResponseEntity<ResearchGroupLargeDTO> getResourceGroupDetails(@PathVariable UUID researchGroupId) {
        return ResponseEntity.ok(researchGroupService.getResearchGroupDetails(researchGroupId));
    }
}
