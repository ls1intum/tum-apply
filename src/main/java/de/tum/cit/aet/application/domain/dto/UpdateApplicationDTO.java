package de.tum.cit.aet.application.domain.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateApplicationDTO(
    @NotNull UUID applicationId,
    LocalDate desiredDate,
    @NotNull ApplicationState applicationState,
    String projects,
    String specialSkills,
    String motivation
) {}
