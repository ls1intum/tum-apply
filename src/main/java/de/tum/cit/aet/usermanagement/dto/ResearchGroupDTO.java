package de.tum.cit.aet.usermanagement.dto;

import java.util.UUID;

public record ResearchGroupDTO(
    UUID id,
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
    String city
) {}
