package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for research group information in admin views.
 * This DTO provides essential information about research groups for administrative
 * management, including approval/denial workflows.
 *
 * <p>This record contains the minimal set of fields needed for admins to:
 * <ul>
 *   <li>View research group details in a paginated list</li>
 *   <li>Filter and sort research groups by status and creation date</li>
 *   <li>Perform approval/denial actions on research groups</li>
 * </ul>
 *
 * @param id Unique identifier of the research group
 * @param researchGroup Display name of the research group
 * @param professorName Name of the research group head/professor
 * @param status Current state of the research group (DRAFT, ACTIVE, DENIED)
 * @param createdAt Timestamp when the research group was created
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupAdminDTO(
    UUID id,
    String researchGroup,
    String professorName,
    DepartmentDTO department,
    ResearchGroupState status,
    LocalDateTime createdAt
) {
    /**
     * Converts a {@link ResearchGroup} entity to a {@link ResearchGroupAdminDTO}.
     *
     * @param researchGroup the research group entity to convert
     * @return the corresponding {@link ResearchGroupAdminDTO}
     */
    public static ResearchGroupAdminDTO fromEntity(ResearchGroup researchGroup) {
        return new ResearchGroupAdminDTO(
            researchGroup.getResearchGroupId(),
            researchGroup.getName(),
            researchGroup.getHead(),
            DepartmentDTO.fromEntity(researchGroup.getDepartment()),
            researchGroup.getState(),
            researchGroup.getCreatedAt()
        );
    }
}
