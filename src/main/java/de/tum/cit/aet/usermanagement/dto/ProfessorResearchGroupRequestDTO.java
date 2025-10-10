package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for professor research group creation requests during onboarding.
 * Contains all fields that a professor can fill in the onboarding form.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ProfessorResearchGroupRequestDTO(
    // Required Personal Information
    String title,
    String firstName,
    String lastName,
    String universityId,

    // Required Research Group Information
    String researchGroupHead,
    String researchGroupName,

    // Optional Research Group Information
    String abbreviation,
    String contactEmail,
    String website,
    String school,
    String description,
    String defaultFieldOfStudies,

    // Optional Address Information
    String street,
    String postalCode,
    String city
) {}
