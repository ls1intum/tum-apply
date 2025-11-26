package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.usermanagement.dto.SchoolCreationDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolDTO;
import de.tum.cit.aet.usermanagement.service.SchoolService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
     * @return HTTP 201 Created with the created school
     */
    @Admin
    @PostMapping
    public ResponseEntity<SchoolDTO> createSchool(@Valid @RequestBody SchoolCreationDTO dto) {
        log.info("POST /api/schools - Creating school: {}", dto.name());
        SchoolDTO created = schoolService.createSchool(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all schools with their departments.
     *
     * @return HTTP 200 OK with list of all schools
     */
    @Public
    @GetMapping
    public ResponseEntity<List<SchoolDTO>> getAllSchools() {
        log.info("GET /api/schools - Fetching all schools");
        List<SchoolDTO> schools = schoolService.getAllSchools();
        return ResponseEntity.ok(schools);
    }

    /**
     * Get a specific school by ID.
     *
     * @param id the school ID
     * @return HTTP 200 OK with the school
     */
    @Public
    @GetMapping("/{id}")
    public ResponseEntity<SchoolDTO> getSchoolById(@PathVariable UUID id) {
        log.info("GET /api/schools/{} - Fetching school by ID", id);
        SchoolDTO school = schoolService.getSchoolById(id);
        return ResponseEntity.ok(school);
    }
}
