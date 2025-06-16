package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ApplicationEvaluationOverviewDTO(
    @NotNull UUID applicationId,
    ApplicantEvaluationOverviewDTO applicant,
    @NotNull ApplicationState applicationState,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
    String jobName,
    Integer rating,
    Instant appliedAt
) {
    /**
     * Creates an {@link ApplicationEvaluationOverviewDTO} from the given {@link Application} entity.
     * Combines application, applicant, and job details into a single overview DTO.
     *
     * @param application the {@link Application} entity to convert
     * @return a new {@link ApplicationEvaluationOverviewDTO} populated with overview data
     */
    public static ApplicationEvaluationOverviewDTO fromApplication(Application application) {
        Applicant applicant = application.getApplicant();
        Job job = application.getJob();

        return new ApplicationEvaluationOverviewDTO(
            application.getApplicationId(),
            ApplicantEvaluationOverviewDTO.getFromEntity(applicant),
            application.getState(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation(),
            job.getTitle(),
            application.getRating(),
            application.getCreatedAt()
        );
    }
}
