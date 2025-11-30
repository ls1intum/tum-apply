package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.Department;
import java.util.UUID;

/**
 * DTO for {@link Department} with school information.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record DepartmentDTO(UUID departmentId, String name, SchoolShortDTO school) {
    public static DepartmentDTO fromEntity(Department department) {
        if (department == null) {
            return null;
        }
        return new DepartmentDTO(department.getDepartmentId(), department.getName(), SchoolShortDTO.fromEntity(department.getSchool()));
    }
}
