package de.tum.cit.aet.application.domain.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class ApplicationOverviewDTO {

    private UUID applicationId;
    private String jobTitle;
    private String researchGroup;
    private ApplicationState applicationState;
    private Instant createdAt;
}
