package de.tum.cit.aet.evaluation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationEvaluationDetailDTO(@NotNull ApplicationDetailDTO applicationDetailDTO, Integer rating, LocalDateTime appliedAt) {
    /**
     * Creates an {@link ApplicationEvaluationDetailDTO} from the given {@link Application} entity.
     *
     * @param application the {@link Application} entity
     * @return a new {@link ApplicationEvaluationDetailDTO} populated from the application data
     */
    public static ApplicationEvaluationDetailDTO fromApplication(Application application) {
        return new ApplicationEvaluationDetailDTO(
            ApplicationDetailDTO.getFromEntity(application),
            application.getRating(),
            application.getCreatedAt()
        );
    }
}
