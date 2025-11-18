package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupDepartment;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupSchool;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for {@link ResearchGroup}
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupDTO(
        @NotBlank String name,
        String abbreviation,
        @NotBlank String head,
        ResearchGroupDepartment department,
        ResearchGroupSchool school,
        @Email String email,
        String website,
        String description,
        String defaultFieldOfStudies,
        String street,
        String postalCode,
        String city,
        ResearchGroupState state) {
    /**
     * @param researchGroup the ResearchGroup entity
     * @return the ResearchGroupDTO from the entity
     * @throws EntityNotFoundException if the ResearchGroup entity is null
     */
    public static ResearchGroupDTO getFromEntity(ResearchGroup researchGroup) {
        if (researchGroup == null) {
            throw new EntityNotFoundException("ResearchGroup entity should not be null");
        }

        return new ResearchGroupDTO(
                researchGroup.getName(),
                researchGroup.getAbbreviation(),
                researchGroup.getHead(),
                researchGroup.getDepartment(),
                researchGroup.getSchool(),
                researchGroup.getEmail(),
                researchGroup.getWebsite(),
                researchGroup.getDescription(),
                researchGroup.getDefaultFieldOfStudies(),
                researchGroup.getStreet(),
                researchGroup.getPostalCode(),
                researchGroup.getCity(),
                researchGroup.getState());
    }
}
