package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationForApplicantDTO(
    UUID applicationId,
    ApplicantDTO applicant,
    JobCardDTO job,
    ApplicationState applicationState,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
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
            ApplicantDTO.getFromEntity(application.getApplicant()), //new UserDTO(), //TODO
            null, // TODO JobDTO.getFromEntity(application.getJob()),
            application.getState(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation(),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
