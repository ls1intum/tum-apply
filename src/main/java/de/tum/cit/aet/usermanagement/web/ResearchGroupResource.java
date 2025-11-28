package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.security.CheckAccess;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployeeOrAdmin;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.AddMembersToResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.EmployeeResearchGroupRequestDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupRequestDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing research groups.
 */
@Slf4j
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
        log.info("GET /api/research-groups?pageNumber={}&pageSize={}", pageDTO.pageNumber(), pageDTO.pageSize());
        PageResponseDTO<ResearchGroupDTO> researchGroups = researchGroupService.getAllResearchGroups(pageDTO);
        return ResponseEntity.ok(researchGroups);
    }

    /**
     * Returns paginated members of the current user's research group.
     *
     * @param pageDTO the pagination parameters
     * @return paginated list of members
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/members")
    public ResponseEntity<PageResponseDTO<UserShortDTO>> getResearchGroupMembers(@ParameterObject @Valid @ModelAttribute PageDTO pageDTO) {
        log.info("GET /api/research-groups/members?pageNumber={}&pageSize={}", pageDTO.pageNumber(), pageDTO.pageSize());
        PageResponseDTO<UserShortDTO> members = researchGroupService.getResearchGroupMembers(pageDTO);
        return ResponseEntity.ok(members);
    }

    /**
     * Removes a member from the current user's research group.
     *
     * @param userId the ID of the user to remove from the research group
     * @return no content response
     */
    @ProfessorOrEmployeeOrAdmin
    @DeleteMapping("/members/{userId}")
    public ResponseEntity<Void> removeMemberFromResearchGroup(@PathVariable UUID userId) {
        log.info("DELETE /api/research-groups/members/{}", userId);
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
        log.info("GET /api/research-groups/{}", id);
        ResearchGroupDTO researchGroup = researchGroupService.getResearchGroup(id);
        return ResponseEntity.ok(researchGroup);
    }

    /**
     * Get detailed information about a research group.
     *
     * @param researchGroupId the ID of the research group to get details for
     * @return the detailed research group information
     */
    @CheckAccess
    @GetMapping("/detail/{researchGroupId}")
    public ResponseEntity<ResearchGroupLargeDTO> getResourceGroupDetails(@PathVariable UUID researchGroupId) {
        log.info("GET /api/research-groups/detail/{}", researchGroupId);
        return ResponseEntity.ok(researchGroupService.getResearchGroupDetails(researchGroupId));
    }

    /**
     * Update a research group.
     *
     * @param id the ID of the research group to update
     * @param researchGroupDTO the research group data to update
     * @return the updated research group
     */
    @CheckAccess
    @PutMapping("/{id}")
    public ResponseEntity<ResearchGroupDTO> updateResearchGroup(
        @PathVariable UUID id,
        @Valid @RequestBody ResearchGroupDTO researchGroupDTO
    ) {
        log.info("PUT /api/research-groups/{}", id);
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
    @Authenticated
    @PostMapping("/professor-request")
    public ResponseEntity<ResearchGroupDTO> createProfessorResearchGroupRequest(@Valid @RequestBody ResearchGroupRequestDTO request) {
        log.info("POST /api/research-groups/professor-request name={} uniId={}", request.researchGroupName(), request.universityId());
        ResearchGroup created = researchGroupService.createProfessorResearchGroupRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResearchGroupDTO.getFromEntity(created));
    }

    /**
     * Creates an employee research group access request during onboarding.
     * Sends an email to administrators with user and professor information.
     *
     * @param request the employee's research group request
     * @return HTTP 204 No Content on success
     */
    @Authenticated
    @PostMapping("/employee-request")
    public ResponseEntity<Void> createEmployeeResearchGroupRequest(@Valid @RequestBody EmployeeResearchGroupRequestDTO request) {
        log.info("POST /api/research-groups/employee-request professorName={}", request.professorName());
        researchGroupService.createEmployeeResearchGroupRequest(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Adds members to the current user's research group.
     *
     * @param dto the DTO containing user IDs to add
     * @return no content response
     */
    @ProfessorOrEmployeeOrAdmin
    @PostMapping("/members")
    public ResponseEntity<Void> addMembersToResearchGroup(@Valid @RequestBody AddMembersToResearchGroupDTO dto) {
        log.info("POST /api/research-groups/members - adding {} members", dto.userIds().size());
        researchGroupService.addMembersToResearchGroup(dto.userIds(), dto.researchGroupId());
        return ResponseEntity.noContent().build();
    }
}
