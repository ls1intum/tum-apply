package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.service.ResearchGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing research groups.
 * Provides endpoints for creating, updating, deleting, and retrieving research groups.
 */
@Slf4j
@RestController
@RequestMapping("/api/research-groups")
@RequiredArgsConstructor
@Tag(name = "Research Group Management", description = "Operations for managing research groups")
public class ResearchGroupResource {

    private final ResearchGroupService researchGroupService;

    /**
     * {@code GET /api/research-groups} : Get all research groups.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of research groups
     */
    @GetMapping
    @Operation(
        summary = "Get all research groups",
        description = "Retrieves a list of all research groups in the system"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved research groups",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ResearchGroupDTO.class)
            )
        )
    })
    public ResponseEntity<List<ResearchGroupDTO>> getAllResearchGroups() {
        log.debug("REST request to get all research groups");
        List<ResearchGroupDTO> researchGroups = researchGroupService.getAllResearchGroups();
        return ResponseEntity.ok(researchGroups);
    }

    /**
     * {@code GET /api/research-groups/{id}} : Get a specific research group by ID.
     *
     * @param id the ID of the research group to retrieve
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the research group, or {@code 404 (Not Found)}
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get research group by ID",
        description = "Retrieves a specific research group by its unique identifier"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved research group",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ResearchGroupDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Research group not found",
            content = @Content
        )
    })
    public ResponseEntity<ResearchGroupDTO> getResearchGroup(
        @Parameter(description = "ID of the research group to retrieve", required = true)
        @PathVariable UUID id
    ) {
        log.debug("REST request to get research group: {}", id);
        ResearchGroupDTO researchGroup = researchGroupService.getResearchGroup(id);
        return ResponseEntity.ok(researchGroup);
    }

    /**
     * {@code POST /api/research-groups} : Create a new research group.
     *
     * @param researchGroupDTO the research group to create
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and the created research group
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new research group",
        description = "Creates a new research group with the provided information"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Research group successfully created",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ResearchGroupDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied - admin role required",
            content = @Content
        )
    })
    public ResponseEntity<ResearchGroupDTO> createResearchGroup(
        @Parameter(description = "Research group data to create", required = true)
        @RequestBody ResearchGroupDTO researchGroupDTO
    ) {
        log.debug("REST request to create research group: {}", researchGroupDTO.name());
        ResearchGroupDTO createdResearchGroup = researchGroupService.createResearchGroup(researchGroupDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdResearchGroup);
    }

    /**
     * {@code PUT /api/research-groups/{id}} : Update a research group.
     * Supports both full and partial updates - only non-null fields will be updated.
     *
     * @param id the ID of the research group to update
     * @param researchGroupDTO the research group data (partial or complete)
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the updated research group
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @researchGroupService.existsById(#id) and hasRole('PROFESSOR')")
    @Operation(
        summary = "Update research group",
        description = "Updates a research group. Supports partial updates - only provided fields will be modified."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Research group successfully updated",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ResearchGroupDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied - insufficient permissions",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Research group not found",
            content = @Content
        )
    })
    public ResponseEntity<ResearchGroupDTO> updateResearchGroup(
        @Parameter(description = "ID of the research group to update", required = true)
        @PathVariable UUID id,
        @Parameter(description = "Research group data to update", required = true)
        @RequestBody ResearchGroupDTO researchGroupDTO
    ) {
        log.debug("REST request to update research group: {}", id);
        ResearchGroupDTO updatedResearchGroup = researchGroupService.updateResearchGroup(id, researchGroupDTO);
        return ResponseEntity.ok(updatedResearchGroup);
    }

    /**
     * {@code DELETE /api/research-groups/{id}} : Delete a research group.
     *
     * @param id the ID of the research group to delete
     * @return the {@link ResponseEntity} with status {@code 204 (No Content)}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Delete research group",
        description = "Deletes a research group by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "204",
            description = "Research group successfully deleted",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "403",
            description = "Access denied - admin role required",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Research group not found",
            content = @Content
        )
    })
    public ResponseEntity<Void> deleteResearchGroup(
        @Parameter(description = "ID of the research group to delete", required = true)
        @PathVariable UUID id
    ) {
        log.debug("REST request to delete research group: {}", id);
        researchGroupService.deleteResearchGroup(id);
        return ResponseEntity.noContent().build();
    }
}