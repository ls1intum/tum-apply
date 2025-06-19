package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ApplicationEvaluationDetailDTO(
    @NotNull UUID applicationId,
    ApplicantEvaluationDetailDTO applicant,
    @NotNull ApplicationState state,
    String jobName,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
    Integer rating,
    LocalDateTime appliedAt
) {
    /**
     * Creates an {@link ApplicationEvaluationDetailDTO} from the given {@link Application} entity.
     *
     * @param application the {@link Application} entity
     * @return a new {@link ApplicationEvaluationDetailDTO} populated from the application data
     */
    public static ApplicationEvaluationDetailDTO fromApplication(Application application) {
        Applicant applicant = application.getApplicant();
        Job job = application.getJob();

        return new ApplicationEvaluationDetailDTO(
            application.getApplicationId(),
            ApplicantEvaluationDetailDTO.getFromEntity(applicant),
            application.getState(),
            job.getTitle(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation(),
            application.getRating(),
            application.getCreatedAt()
        );
    }
}
