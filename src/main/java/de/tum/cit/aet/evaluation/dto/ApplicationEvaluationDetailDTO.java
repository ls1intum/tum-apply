package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.UUID;

//TODO define additional fields
public record ApplicationEvaluationDetailDTO(UUID applicationId, String firstName, String lastName) {
    /**
     * Creates an {@link ApplicationEvaluationDetailDTO} from the given {@link Application} entity.
     *
     * @param application the {@link Application} entity
     * @return a new {@link ApplicationEvaluationDetailDTO} populated from the application data
     */
    public static ApplicationEvaluationDetailDTO fromApplication(Application application) {
        Applicant applicant = application.getApplicant();
        return new ApplicationEvaluationDetailDTO(application.getApplicationId(), applicant.getFirstName(), applicant.getLastName());
    }
}
