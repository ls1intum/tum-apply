package de.tum.cit.aet.application.domain.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.dto.JobCardDTO;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record ApplicationApplicantDTO(
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
    public static ApplicationApplicantDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        return new ApplicationApplicantDTO(
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
