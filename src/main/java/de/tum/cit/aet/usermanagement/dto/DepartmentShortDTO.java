package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.Department;
import java.util.UUID;

/**
 * Short DTO for {@link Department} without school information to avoid circular references.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record DepartmentShortDTO(UUID departmentId, String name) {
    public static DepartmentShortDTO fromEntity(Department department) {
        if (department == null) {
            return null;
        }
        return new DepartmentShortDTO(department.getDepartmentId(), department.getName());
    }
}
