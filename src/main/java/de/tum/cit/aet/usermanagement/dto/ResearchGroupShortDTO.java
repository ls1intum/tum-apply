package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.UUID;
import lombok.Data;

/**
 * Reduced representation of a ResearchGroup for embedding in other DTOs.
 */
@Data
public class ResearchGroupShortDTO {

    private UUID researchGroupId;
    private String name;

    public ResearchGroupShortDTO() {
        // default constructor
    }

    public ResearchGroupShortDTO(ResearchGroup group) {
        this.researchGroupId = group.getResearchGroupId();
        this.name = group.getName();
    }
}
