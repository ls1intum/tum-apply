package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationForApplicantDTO(
    UUID applicationId,
    ApplicantDTO applicant,
    @NotNull JobCardDTO job,
    @NotNull ApplicationState applicationState,
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
    public static ApplicationForApplicantDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        Job job = application.getJob();
        return new ApplicationForApplicantDTO(
            application.getApplicationId(),
            ApplicantDTO.getFromEntity(application.getApplicant()),
            new JobCardDTO(
                job.getJobId(),
                job.getTitle(),
                job.getFieldOfStudies(),
                job.getLocation(),
                job.getSupervisingProfessor().getLastName(),
                application.getApplicationId(),
                application.getState(),
                job.getWorkload(),
                job.getStartDate(),
                job.getCreatedAt()
            ),
            application.getState(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation(),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
