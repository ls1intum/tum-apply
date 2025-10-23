package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for research group admin view
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupAdminDTO(
    UUID id,
    String researchGroup,
    String professorName,
    ResearchGroupState status,
    LocalDateTime createdAt
) {
    public static ResearchGroupAdminDTO fromEntity(ResearchGroup researchGroup) {
        return new ResearchGroupAdminDTO(
            researchGroup.getResearchGroupId(),
            researchGroup.getName(),
            researchGroup.getHead(),
            researchGroup.getState(),
            researchGroup.getCreatedAt()
        );
    }
}
