package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.dto.SchoolCreationDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolShortDTO;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.SchoolRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for managing schools.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchoolService {

    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;

    /**
     * Create a new school.
     *
     * @param dto the school creation DTO
     * @return the created school as SchoolShortDTO (without departments)
     * @throws ResourceAlreadyExistsException if a school with the same name already exists
     */
    public SchoolShortDTO createSchool(SchoolCreationDTO dto) {
        if (schoolRepository.existsByNameIgnoreCase(dto.name())) {
            throw new ResourceAlreadyExistsException("School with name '" + dto.name() + "' already exists");
        }

        School school = new School();
        school.setName(dto.name());
        school.setAbbreviation(dto.abbreviation());

        school = schoolRepository.save(school);

        return SchoolShortDTO.fromEntity(school);
    }

    /**
     * Get all schools without their departments (lighter response).
     *
     * @return list of all schools without departments
     */
    public List<SchoolShortDTO> getAllSchools() {
        return schoolRepository.findAll().stream().map(SchoolShortDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * Get all schools with their departments (heavier response, fetches departments for each school).
     *
     * @return list of all schools with their departments
     */
    public List<SchoolDTO> getAllSchoolsWithDepartments() {
        return schoolRepository
            .findAll()
            .stream()
            .map(school -> {
                List<Department> departments = departmentRepository.findBySchoolSchoolId(school.getSchoolId());
                return SchoolDTO.fromEntity(school, departments);
            })
            .collect(Collectors.toList());
    }

    /**
     * Get a specific school by ID with its departments.
     *
     * @param schoolId the school ID
     * @return the school with its departments
     * @throws EntityNotFoundException if school not found
     */
    public SchoolDTO getSchoolByIdWithDepartments(UUID schoolId) {
        School school = schoolRepository
            .findById(schoolId)
            .orElseThrow(() -> new EntityNotFoundException("School not found with ID: " + schoolId));
        List<Department> departments = departmentRepository.findBySchoolSchoolId(schoolId);
        return SchoolDTO.fromEntity(school, departments);
    }
}
