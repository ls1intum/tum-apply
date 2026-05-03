package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileExportDTO(
    String firstName,
    String lastName,
    String email,
    String gender,
    String nationality,
    LocalDate birthday,
    boolean aiFeaturesEnabled,
    Instant aiConsentedAt
) {}
