package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationForApplicantDTO(
    @NotNull UUID applicationId,
    ApplicantDTO applicant,
    @NotNull JobCardDTO job,
    @NotNull ApplicationState applicationState,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
    Set<CustomFieldAnswerDTO> customFields
) {}
