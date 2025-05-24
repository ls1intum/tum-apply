package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.constants.GradingScale;
import jakarta.validation.constraints.NotNull;

public record ApplicantDTO(
    @NotNull UserDTO user,
    String street,
    String postalCode,
    String city,
    String country,
    String bachelorDegreeName,
    GradingScale bachelorGradingScale,
    String bachelorGrade,
    String bachelorUniversity,
    String masterDegreeName,
    GradingScale masterGradingScale,
    String masterGrade,
    String masterUniversity
) {}
