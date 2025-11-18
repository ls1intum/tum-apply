package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import de.tum.cit.aet.usermanagement.constants.ResearchGroupDepartment;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupSchool;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupCreationDTO(
        @NotBlank @Size(min = 3, max = 150) String name,
        @NotBlank @Size(min = 3, max = 150) String headName,
        @NotBlank @Size(min = 3, max = 7) String universityId,
        @Email String email,
        String abbreviation,
        String website,
        ResearchGroupSchool school,
        ResearchGroupDepartment department,
        String description,
        String defaultFieldOfStudies,
        String street,
        String postalCode,
        String city,
        ResearchGroupState state) {
}
