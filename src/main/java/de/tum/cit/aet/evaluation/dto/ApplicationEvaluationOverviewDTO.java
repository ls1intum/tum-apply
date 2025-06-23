package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.time.LocalDateTime;
import java.util.UUID;

public record ApplicationEvaluationOverviewDTO(
    UUID applicationId,
    String avatar,
    String name,
    ApplicationState state,
    String jobName,
    Integer rating,
    LocalDateTime appliedAt
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
            applicant.getAvatar(),
            applicant.getFirstName() + " " + applicant.getLastName(),
            application.getState(),
            job.getTitle(),
            application.getRating(),
            application.getCreatedAt()
        );
    }
}
