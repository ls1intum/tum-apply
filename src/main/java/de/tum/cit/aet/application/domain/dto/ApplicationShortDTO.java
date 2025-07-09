package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationShortDTO(
    @NotNull UUID applicationId,
    String email,
    String firstName,
    String lastName,
    @NotNull ApplicationState applicationState
) {}
