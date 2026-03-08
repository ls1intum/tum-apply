package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.usermanagement.dto.SchoolCreationDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolShortDTO;
import de.tum.cit.aet.usermanagement.service.SchoolService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing schools.
 */
@Slf4j
@RestController
@RequestMapping("/api/schools")
@RequiredArgsConstructor
public class SchoolResource {

    private final SchoolService schoolService;

    /**
     * Create a new school.
     *
     * @param dto the school creation DTO
     * @return HTTP 201 Created with the created school (without departments)
     */
    @Admin
    @PostMapping
    public ResponseEntity<SchoolShortDTO> createSchool(@Valid @RequestBody SchoolCreationDTO dto) {
        log.info("POST /api/schools - Creating school: {}", dto.name());
        SchoolShortDTO created = schoolService.createSchool(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all schools without departments (lightweight).
     *
     * @return HTTP 200 OK with list of all schools without departments
     */
    @Public
    @GetMapping
    public ResponseEntity<List<SchoolShortDTO>> getAllSchools() {
        log.info("GET /api/schools - Fetching all schools without departments");
        List<SchoolShortDTO> schools = schoolService.getAllSchools();
        return ResponseEntity.ok(schools);
    }

    /**
     * Get paginated schools for admin view with optional search.
     *
     * @param pageDTO the pagination information
     * @param searchQuery optional search query to filter schools
     * @param sortDTO the sorting information
     * @param request the HTTP request
     * @return HTTP 200 OK with paginated schools for admin view
     */
    @Admin
    @GetMapping("/admin/search")
    public ResponseEntity<PageResponseDTO<SchoolDTO>> getSchoolsForAdmin(
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO,
        @RequestParam(required = false) String searchQuery,
        @ParameterObject @Valid @ModelAttribute SortDTO sortDTO,
        HttpServletRequest request
    ) {
        log.info(
            "GET /api/schools/admin/search - Fetching schools for admin with page={}, searchQuery={}, sort={}, uri={}",
            pageDTO,
            searchQuery,
            sortDTO,
            request.getRequestURI()
        );
        PageResponseDTO<SchoolDTO> response = schoolService.getSchoolsForAdmin(pageDTO, searchQuery, sortDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all schools with their departments (includes nested department data).
     *
     * @return HTTP 200 OK with list of all schools with their departments
     */
    @Public
    @GetMapping("/with-departments")
    public ResponseEntity<List<SchoolDTO>> getAllSchoolsWithDepartments() {
        log.info("GET /api/schools/with-departments - Fetching all schools with departments");
        List<SchoolDTO> schools = schoolService.getAllSchoolsWithDepartments();
        return ResponseEntity.ok(schools);
    }

    /**
     * Get a specific school by ID with its departments.
     *
     * @param id the school ID
     * @return HTTP 200 OK with the school and its departments
     */
    @Public
    @GetMapping("/{id}")
    public ResponseEntity<SchoolDTO> getSchoolById(@PathVariable UUID id) {
        log.info("GET /api/schools/{} - Fetching school by ID with departments", id);
        SchoolDTO school = schoolService.getSchoolByIdWithDepartments(id);
        return ResponseEntity.ok(school);
    }

    /**
     * Update an existing school.
     *
     * @param id the school ID
     * @param dto the school update DTO
     * @return HTTP 200 OK with the updated school (without departments)
     */
    @Admin
    @PutMapping("/update/{id}")
    public ResponseEntity<SchoolShortDTO> updateSchool(@PathVariable UUID id, @Valid @RequestBody SchoolCreationDTO dto) {
        log.info("PUT /api/schools/{} - Updating school: {}", id, dto.name());
        SchoolShortDTO updated = schoolService.updateSchool(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a school.
     *
     * @param id the school ID
     * @return HTTP 204 No Content when deletion is successful
     */
    @Admin
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable UUID id) {
        log.info("DELETE /api/schools/{} - Deleting school", id);
        schoolService.deleteSchool(id);
        return ResponseEntity.noContent().build();
    }
}
