package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.security.CheckAccess;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.security.annotations.ProfessorOrAdmin;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ProfessorResearchGroupRequestDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
     * @param pageDTO the pagination parameters
     * @return the list of research groups
     */
    @GetMapping
    public ResponseEntity<PageResponseDTO<ResearchGroupDTO>> getAllResearchGroups(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        PageResponseDTO<ResearchGroupDTO> researchGroups = researchGroupService.getAllResearchGroups(pageDTO);
        return ResponseEntity.ok(researchGroups);
    }

    /**
     * Returns paginated members of the current user's research group.
     *
     * @param pageDTO the pagination parameters
     * @return paginated list of members
     */
    @GetMapping("/members")
    @Admin
    public ResponseEntity<PageResponseDTO<UserShortDTO>> getResearchGroupMembers(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        PageResponseDTO<UserShortDTO> members = researchGroupService.getResearchGroupMembers(pageDTO);
        return ResponseEntity.ok(members);
    }

    /**
     * Removes a member from the current user's research group.
     *
     * @param userId the ID of the user to remove from the research group
     * @return no content response
     */
    @DeleteMapping("/members/{userId}")
    @ProfessorOrAdmin
    public ResponseEntity<Void> removeMemberFromResearchGroup(@PathVariable UUID userId) {
        researchGroupService.removeMemberFromResearchGroup(userId);
        return ResponseEntity.noContent().build();
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
     * Get detailed information about a research group.
     *
     * @param researchGroupId the ID of the research group to get details for
     * @return the detailed research group information
     */
    @GetMapping("/detail/{researchGroupId}")
    @CheckAccess
    public ResponseEntity<ResearchGroupLargeDTO> getResourceGroupDetails(@PathVariable UUID researchGroupId) {
        return ResponseEntity.ok(researchGroupService.getResearchGroupDetails(researchGroupId));
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
        @Valid @RequestBody ResearchGroupDTO researchGroupDTO
    ) {
        ResearchGroupDTO updatedResearchGroup = researchGroupService.updateResearchGroup(id, researchGroupDTO);
        return ResponseEntity.ok(updatedResearchGroup);
    }

    /**
     * Creates a research group request from a professor during onboarding.
     * The research group starts in DRAFT state and needs admin approval.
     *
     * @param request the professor's research group request
     * @return the created research group in DRAFT state
     */
    @PostMapping("/professor-request")
    @Authenticated // Any authenticated user can submit a request when using professor onboarding
    public ResponseEntity<ResearchGroupDTO> createProfessorResearchGroupRequest(
        @Valid @RequestBody ProfessorResearchGroupRequestDTO request
    ) {
        ResearchGroup created = researchGroupService.createProfessorResearchGroupRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResearchGroupDTO.getFromEntity(created));
    }

    /**
     * Gets all DRAFT research groups for admin review.
     *
     * @param pageDTO the pagination parameters
     * @return paginated list of DRAFT research groups
     */
    @GetMapping("/draft")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponseDTO<ResearchGroupDTO>> getDraftResearchGroups(
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO
    ) {
        PageResponseDTO<ResearchGroupDTO> draftGroups = researchGroupService.getDraftResearchGroups(pageDTO);
        return ResponseEntity.ok(draftGroups);
    }

    /**
     * Activates a DRAFT research group (admin only).
     *
     * @param researchGroupId the ID of the research group to activate
     * @return the activated research group
     */
    @PostMapping("/{researchGroupId}/activate")
    @Admin
    public ResponseEntity<ResearchGroupDTO> activateResearchGroup(@PathVariable UUID researchGroupId) {
        ResearchGroup activated = researchGroupService.activateResearchGroup(researchGroupId);
        return ResponseEntity.ok(ResearchGroupDTO.getFromEntity(activated));
    }

    /**
     * Denies a DRAFT research group (admin only).
     *
     * @param researchGroupId the ID of the research group to deny
     * @return the denied research group
     */
    @PostMapping("/{researchGroupId}/deny")
    @Admin
    public ResponseEntity<ResearchGroupDTO> denyResearchGroup(@PathVariable UUID researchGroupId) {
        ResearchGroup denied = researchGroupService.denyResearchGroup(researchGroupId);
        return ResponseEntity.ok(ResearchGroupDTO.getFromEntity(denied));
    }
}
