package de.tum.cit.aet.application.domain.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.dto.InstantToRelativeTimeLabelTranslator;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationOverviewDTO {

    private UUID applicationId;
    private String jobTitle;
    private String researchGroup;
    private ApplicationState applicationState;
    private String timeSinceCreation;

    public ApplicationOverviewDTO(
        UUID applicationId,
        String jobTitle,
        String researchGroup,
        ApplicationState applicationState,
        Instant createdAt
    ) {
        this.applicationId = applicationId;
        this.jobTitle = jobTitle;
        this.researchGroup = researchGroup;
        this.applicationState = applicationState;
        this.timeSinceCreation = InstantToRelativeTimeLabelTranslator.getRelativeTimeLabel(createdAt);
    }
}
