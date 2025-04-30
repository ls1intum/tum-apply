package de.tum.cit.aet.application.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.service.dto.UserDTO;
import de.tum.cit.aet.job.dto.JobCardDTO;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record ApplicationApplicantDTO(
    UUID applicationId,
    UserDTO applicant,
    JobCardDTO job,
    ApplicationState applicationState,
    String motivation,
    Instant desiredDate,
    Set<CustomFieldAnswerDTO> customFields
) {
    public static ApplicationApplicantDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        return new ApplicationApplicantDTO(
            application.getApplicationId(),
            new UserDTO(), //TODO
            null, // TODO JobDTO.getFromEntity(application.getJob()),
            application.getState(),
            application.getMotivation(),
            application.getDesiredStartDate(),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
