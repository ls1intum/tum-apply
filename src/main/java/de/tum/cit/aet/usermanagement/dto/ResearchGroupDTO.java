package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for {@link ResearchGroup}
 */
public record ResearchGroupDTO(
    UUID researchGroupId,
    String name,
    String abbreviation,
    String head,
    String email,
    String website,
    String school,
    String description,
    String defaultFieldOfStudies,
    String street,
    String postalCode,
    String city,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {
    
    /**
     * @param researchGroup the ResearchGroup entity
     * @return the ResearchGroupDTO from the entity
     */
    public static ResearchGroupDTO getFromEntity(ResearchGroup researchGroup) {
        if (researchGroup == null) {
            return null;
        }
        
        return new ResearchGroupDTO(
            researchGroup.getResearchGroupId(),
            researchGroup.getName(),
            researchGroup.getAbbreviation(),
            researchGroup.getHead(),
            researchGroup.getEmail(),
            researchGroup.getWebsite(),
            researchGroup.getSchool(),
            researchGroup.getDescription(),
            researchGroup.getDefaultFieldOfStudies(),
            researchGroup.getStreet(),
            researchGroup.getPostalCode(),
            researchGroup.getCity(),
            researchGroup.getCreatedAt(),
            researchGroup.getLastModifiedAt()
        );
    }
    
}
