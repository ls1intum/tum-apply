package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.usermanagement.dto.DepartmentCreationDTO;
import de.tum.cit.aet.usermanagement.dto.DepartmentDTO;
import de.tum.cit.aet.usermanagement.service.DepartmentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing departments.
 */
@Slf4j
@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentResource {

    private final DepartmentService departmentService;

    /**
     * Create a new department.
     *
     * @param dto the department creation DTO
     * @return HTTP 201 Created with the created department
     */
    @Admin
    @PostMapping
    public ResponseEntity<DepartmentDTO> createDepartment(@Valid @RequestBody DepartmentCreationDTO dto) {
        log.info("POST /api/departments - Creating department: {}", dto.name());
        DepartmentDTO created = departmentService.createDepartment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all departments or filter by school ID.
     *
     * @param schoolId optional school ID to filter departments
     * @return HTTP 200 OK with list of departments
     */
    @Public
    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> getDepartments(@RequestParam(required = false) UUID schoolId) {
        if (schoolId != null) {
            log.info("GET /api/departments?schoolId={} - Fetching departments for school", schoolId);
            List<DepartmentDTO> departments = departmentService.getDepartmentsBySchoolId(schoolId);
            return ResponseEntity.ok(departments);
        } else {
            log.info("GET /api/departments - Fetching all departments");
            List<DepartmentDTO> departments = departmentService.getAllDepartments();
            return ResponseEntity.ok(departments);
        }
    }

    /**
     * Get a specific department by ID.
     *
     * @param id the department ID
     * @return HTTP 200 OK with the department
     */
    @Public
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO> getDepartmentById(@PathVariable UUID id) {
        log.info("GET /api/departments/{} - Fetching department by ID", id);
        DepartmentDTO department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(department);
    }
}
