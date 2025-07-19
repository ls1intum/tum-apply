package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.dto.ApplicantForApplicationDetailDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationDetailDTO(
    @NotNull UUID applicationId,
    ApplicantForApplicationDetailDTO applicant,
    @NotNull ApplicationState applicationState,
    String jobTitle,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation
) {
    /**
     * @param application
     * @return
     */
    public static ApplicationDetailDTO getFromEntity(Application application, Job job) {
        if (application == null) {
            throw new EntityNotFoundException("Application Entity should not be null");
        }
        Applicant applicant = application.getApplicant();

        return new ApplicationDetailDTO(
            application.getApplicationId(),
            ApplicantForApplicationDetailDTO.getFromEntity(applicant),
            application.getState(),
            job.getTitle(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation()
        );
    }
}
