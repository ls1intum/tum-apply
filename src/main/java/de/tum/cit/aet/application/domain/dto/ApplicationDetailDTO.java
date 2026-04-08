package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.dto.ApplicantForApplicationDetailDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationDetailDTO(
    @NotNull UUID applicationId,
    @NotNull UUID jobId,
    ApplicantForApplicationDetailDTO applicant,
    @NotNull ApplicationState applicationState,
    @NotNull String supervisingProfessorName,
    @NotNull String researchGroup,
    String jobTitle,
    Campus jobLocation,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation
) {
    /**
     * Converts an Application entity to a detail DTO for the evaluation view.
     * Rich-text fields (projects, specialSkills, motivation) are sanitized on read
     * as defense-in-depth before sending to the client.
     *
     * @param application the application entity
     * @param job         the associated job entity
     * @return the detail DTO
     */
    public static ApplicationDetailDTO getFromEntity(Application application, Job job) {
        if (application == null) {
            throw new EntityNotFoundException("Application Entity should not be null");
        }

        return new ApplicationDetailDTO(
            application.getApplicationId(),
            job.getJobId(),
            ApplicantForApplicationDetailDTO.getFromApplicationSnapshot(application),
            application.getState(),
            job.getSupervisingProfessor().getFirstName() + " " + job.getSupervisingProfessor().getLastName(),
            job.getResearchGroup().getName(),
            job.getTitle(),
            job.getLocation(),
            application.getDesiredStartDate(),
            HtmlSanitizer.sanitize(application.getProjects()),
            HtmlSanitizer.sanitize(application.getSpecialSkills()),
            HtmlSanitizer.sanitize(application.getMotivation())
        );
    }
}
