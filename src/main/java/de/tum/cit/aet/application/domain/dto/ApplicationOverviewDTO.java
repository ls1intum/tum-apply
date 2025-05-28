package de.tum.cit.aet.application.domain.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record ApplicationOverviewDTO(
    @NotNull UUID applicationId,
    @NotNull String jobTitle,
    @NotNull String researchGroup,
    @NotNull ApplicationState applicationState,
    LocalDate submitted
) {}
