package de.tum.cit.aet.core.dto.exportdata;

import java.time.LocalDate;

public record UserProfileExportDTO(
    String firstName,
    String lastName,
    String email,
    String gender,
    String nationality,
    LocalDate birthday
) {}
