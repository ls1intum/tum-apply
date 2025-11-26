package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    @JsonInclude(JsonInclude.Include.ALWAYS)
    List<DepartmentShortDTO> departments
) {
    public static SchoolDTO fromEntity(School school) {
        if (school == null) {
            return null;
        }
        
        List<DepartmentShortDTO> departmentDTOs = school.getDepartments() != null
            ? school.getDepartments().stream()
                .map(DepartmentShortDTO::fromEntity)
                .collect(Collectors.toList())
            : List.of();
        
        return new SchoolDTO(
            school.getSchoolId(),
            school.getName(),
            school.getAbbreviation(),
            departmentDTOs
        );
    }
}
