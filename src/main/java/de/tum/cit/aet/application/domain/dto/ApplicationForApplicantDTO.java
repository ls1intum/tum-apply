package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.util.HtmlSanitizer;
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
     * Converts an Application entity to a DTO for the applicant view.
     * Rich-text fields (projects, specialSkills, motivation) are sanitized on read
     * as defense-in-depth before sending to the client.
     *
     * @param application the application entity
     * @return the DTO, or null if the application is null
     */
    public static ApplicationForApplicantDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        Job job = application.getJob();
        return new ApplicationForApplicantDTO(
            application.getApplicationId(),
            ApplicantDTO.getFromApplicationSnapshot(application),
            new JobCardDTO(
                job.getJobId(),
                job.getTitle(),
                job.getLocation(),
                job.getSupervisingProfessor().getLastName(),
                job.getSubjectArea(),
                job.getSupervisingProfessor().getAvatar(),
                application.getApplicationId(),
                application.getState(),
                job.getWorkload(),
                job.getStartDate(),
                job.getEndDate(),
                job.getContractDuration(),
                job.getImage() != null ? job.getImage().getUrl() : null
            ),
            application.getState(),
            application.getDesiredStartDate(),
            HtmlSanitizer.sanitize(application.getProjects()),
            HtmlSanitizer.sanitize(application.getSpecialSkills()),
            HtmlSanitizer.sanitize(application.getMotivation()),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
