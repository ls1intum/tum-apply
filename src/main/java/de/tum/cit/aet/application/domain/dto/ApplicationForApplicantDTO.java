package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.dto.JobCardDTO;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationForApplicantDTO(
    UUID applicationId,
    UUID applicant,
    JobCardDTO job,
    ApplicationState applicationState,
    String motivation,
    LocalDate desiredDate,
    Set<CustomFieldAnswerDTO> customFields
) {
    /**
     *
     * @param application
     * @return
     */
    public static ApplicationForApplicantDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        return new ApplicationForApplicantDTO(
            application.getApplicationId(),
            application.getApplicationId(), //new UserDTO(), //TODO
            null, // TODO JobDTO.getFromEntity(application.getJob()),
            application.getState(),
            application.getMotivation(),
            application.getDesiredStartDate(),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
