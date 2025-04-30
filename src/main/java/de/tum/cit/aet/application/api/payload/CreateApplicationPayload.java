package de.tum.cit.aet.application.api.payload;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.dto.CustomFieldAnswerDTO;
import de.tum.cit.aet.job.dto.JobCardDTO;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record CreateApplicationPayload(
    UUID applicant,
    JobCardDTO job,
    Instant desiredDate,
    ApplicationState applicationState,
    String projects,
    String specialSkills,
    String motivation,
    Set<CustomFieldAnswerDTO> answers
) {}
