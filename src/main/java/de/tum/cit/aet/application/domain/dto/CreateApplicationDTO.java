package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CreateApplicationDTO(
    @NotNull ApplicantDTO applicant,
    @NotNull UUID jobId,
    LocalDate desiredDate,
    @NotNull ApplicationState applicationState,
    String projects,
    String specialSkills,
    String motivation
    // TODO Set<CustomFieldAnswerDTO> answers
) {}
