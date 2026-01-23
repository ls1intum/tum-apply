package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.School;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DTO for {@link School} with nested departments.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record SchoolDTO(
    UUID schoolId,
    String name,
    String abbreviation,
    @JsonInclude(JsonInclude.Include.ALWAYS) List<DepartmentShortDTO> departments
) {
    /**
     * Create SchoolDTO from entity with departments fetched separately.
     *
     * @param school the school entity
     * @param departments list of departments belonging to this school
     * @return the SchoolDTO
     */
    public static SchoolDTO fromEntity(School school, List<Department> departments) {
        if (school == null) {
            return null;
        }

        List<DepartmentShortDTO> departmentDTOs =
            departments != null ? departments.stream().map(DepartmentShortDTO::fromEntity).collect(Collectors.toList()) : List.of();

        return new SchoolDTO(school.getSchoolId(), school.getName(), school.getAbbreviation(), departmentDTOs);
    }
}
