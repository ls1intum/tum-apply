package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

public record ApplicationEvaluationOverviewDTO(
    UUID applicationId,
    String avatar,
    String name,
    ApplicationState state,
    String jobName,
    Integer rating,
    LocalDate appliedAt
) {
    /**
     * Creates an {@link ApplicationEvaluationOverviewDTO} from an {@link Application} entity.
     *
     * @param application the {@link Application} entity to convert; may be {@code null}
     * @return a new {@link ApplicationEvaluationOverviewDTO} with data from the application,
     * or {@code null} if the input is {@code null}
     */
    public static ApplicationEvaluationOverviewDTO fromApplication(Application application) {
        if (application == null) {
            return null;
        }

        return new ApplicationEvaluationOverviewDTO(
            application.getApplicationId(),
            application.getApplicant().getAvatar(),
            application.getApplicant().getFirstName() + " " + application.getApplicant().getLastName(),
            application.getState(),
            application.getJob().getTitle(),
            application.getRating(),
            LocalDate.ofInstant(application.getCreatedAt(), ZoneId.systemDefault())
        ); //use system's timezone to convert Instant
    }
}
