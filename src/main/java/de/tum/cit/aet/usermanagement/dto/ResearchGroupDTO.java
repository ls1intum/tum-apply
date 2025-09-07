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
    
    /**
     * Updates a ResearchGroup entity with non-null values from this DTO.
     * This supports partial updates by only setting fields that are not null.
     *
     * @param researchGroup the ResearchGroup entity to update
     */
    public void updateEntity(ResearchGroup researchGroup) {
        if (name != null) {
            researchGroup.setName(name);
        }
        if (abbreviation != null) {
            researchGroup.setAbbreviation(abbreviation);
        }
        if (head != null) {
            researchGroup.setHead(head);
        }
        if (email != null) {
            researchGroup.setEmail(email);
        }
        if (website != null) {
            researchGroup.setWebsite(website);
        }
        if (school != null) {
            researchGroup.setSchool(school);
        }
        if (description != null) {
            researchGroup.setDescription(description);
        }
        if (defaultFieldOfStudies != null) {
            researchGroup.setDefaultFieldOfStudies(defaultFieldOfStudies);
        }
        if (street != null) {
            researchGroup.setStreet(street);
        }
        if (postalCode != null) {
            researchGroup.setPostalCode(postalCode);
        }
        if (city != null) {
            researchGroup.setCity(city);
        }
    }
}
