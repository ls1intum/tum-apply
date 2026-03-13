package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.util.PageUtil;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.dto.AdminDepartmentFilterDTO;
import de.tum.cit.aet.usermanagement.dto.DepartmentCreationDTO;
import de.tum.cit.aet.usermanagement.dto.DepartmentDTO;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.SchoolRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

/**
 * Service for managing departments.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final SchoolRepository schoolRepository;

    /**
     * Create a new department.
     *
     * @param dto the department creation DTO
     * @return the created department as DTO
     * @throws EntityNotFoundException if the school does not exist
     * @throws ResourceAlreadyExistsException if a department with the same name already exists in the school
     */
    public DepartmentDTO createDepartment(DepartmentCreationDTO dto) {
        School school = schoolRepository
            .findById(dto.schoolId())
            .orElseThrow(() -> new EntityNotFoundException("School not found with ID: " + dto.schoolId()));

        if (departmentRepository.existsByNameIgnoreCaseAndSchoolSchoolId(dto.name(), dto.schoolId())) {
            throw new ResourceAlreadyExistsException(
                "Department with name '" + dto.name() + "' already exists in school '" + school.getName() + "'"
            );
        }

        Department department = new Department();
        department.setName(dto.name());
        department.setSchool(school);

        department = departmentRepository.save(department);

        return DepartmentDTO.fromEntity(department);
    }

    /**
     * Get all departments with their school information.
     *
     * @return list of all departments
     */
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream().map(DepartmentDTO::fromEntity).toList();
    }

    /**
     * Get departments for a specific school.
     *
     * @param schoolId the school ID
     * @return list of departments for the school
     */
    public List<DepartmentDTO> getDepartmentsBySchoolId(UUID schoolId) {
        // Verify school exists
        if (!schoolRepository.existsById(schoolId)) {
            throw new EntityNotFoundException("School not found with ID: " + schoolId);
        }

        return departmentRepository.findBySchoolSchoolIdOrderByNameAsc(schoolId).stream().map(DepartmentDTO::fromEntity).toList();
    }

    /**
     * Retrieves departments for admin with paging, filtering and sorting.
     *
     * @param pageDTO the paging parameters
     * @param filterDTO the filter parameters (searchQuery, schoolNames)
     * @param sortDTO the sorting parameters
     * @param request the HTTP servlet request to extract schoolNames
     * @return a paged response of DepartmentDTOs
     */
    public PageResponseDTO<DepartmentDTO> getDepartmentsForAdmin(
        PageDTO pageDTO,
        AdminDepartmentFilterDTO filterDTO,
        SortDTO sortDTO,
        HttpServletRequest request
    ) {
        String[] schoolNames = request.getParameterValues("schoolNames");
        if (schoolNames != null) {
            filterDTO.setSchoolNames(Arrays.asList(schoolNames));
        }
        PageRequest pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.DEPARTMENTS_ADMIN, true);
        String normalizedSearch = StringUtil.normalizeSearchQuery(filterDTO.getSearchQuery());

        Page<DepartmentDTO> page = departmentRepository.findAllForAdmin(normalizedSearch, filterDTO.getSchoolNames(), pageable);

        return new PageResponseDTO<>(page.getContent(), page.getTotalElements());
    }

    /**
     * Get a specific department by ID.
     *
     * @param departmentId the department ID
     * @return the department as DTO
     * @throws EntityNotFoundException if department not found
     */
    public DepartmentDTO getDepartmentById(UUID departmentId) {
        Department department = departmentRepository
            .findById(departmentId)
            .orElseThrow(() -> new EntityNotFoundException("Department not found with ID: " + departmentId));
        return DepartmentDTO.fromEntity(department);
    }

    /**
     * Update an existing department.
     *
     * @param departmentId the ID of the department to update
     * @param dto the department update DTO
     * @return the updated department as DTO
     * @throws EntityNotFoundException if the department or school does not exist
     * @throws ResourceAlreadyExistsException if a department with the same name already exists in the school
     */
    public DepartmentDTO updateDepartment(UUID departmentId, DepartmentCreationDTO dto) {
        Department department = departmentRepository
            .findById(departmentId)
            .orElseThrow(() -> new EntityNotFoundException("Department not found with ID: " + departmentId));

        School school = schoolRepository
            .findById(dto.schoolId())
            .orElseThrow(() -> new EntityNotFoundException("School not found with ID: " + dto.schoolId()));

        if (
            !department.getName().equalsIgnoreCase(dto.name()) &&
            departmentRepository.existsByNameIgnoreCaseAndSchoolSchoolId(dto.name(), dto.schoolId())
        ) {
            throw new ResourceAlreadyExistsException(
                "Department with name '" + dto.name() + "' already exists in school '" + school.getName() + "'"
            );
        }

        department.setName(dto.name());
        department.setSchool(school);

        department = departmentRepository.save(department);

        return DepartmentDTO.fromEntity(department);
    }

    /**
     * Delete a department.
     *
     * @param departmentId the ID of the department to delete
     * @throws EntityNotFoundException if the department does not exist
     */
    public void deleteDepartment(UUID departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new EntityNotFoundException("Department not found with ID: " + departmentId);
        }
        departmentRepository.deleteById(departmentId);
    }
}
