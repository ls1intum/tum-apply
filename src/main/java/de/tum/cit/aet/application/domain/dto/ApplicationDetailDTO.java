package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.dto.ApplicantForApplicationDetailDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationDetailDTO(
    @NotNull UUID applicationId,
    ApplicantForApplicationDetailDTO applicant,
    @NotNull ApplicationState applicationState,
    String jobTitle,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
    Set<CustomFieldAnswerDTO> customFields
) {
    /**
     * @param application
     * @return
     */
    public static ApplicationDetailDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        return new ApplicationDetailDTO(
            application.getApplicationId(),
            ApplicantForApplicationDetailDTO.getFromEntity(application.getApplicant()),
            application.getState(),
            application.getJob().getTitle(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation(),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
