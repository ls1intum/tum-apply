package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import java.time.ZonedDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobDetailDTO(
    UUID jobId,
    UUID supervisingProfessor,
    UUID researchGroup,
    String fieldOfStudies,
    String researchArea,
    Campus location,
    Integer workload,
    Integer contractDuration,
    FundingType fundingType,
    String title,
    String description,
    String tasks,
    String requirements,
    JobState state,
    ZonedDateTime startDate
    // TODO: Adjust this to a List of CustomFields
    // CustomField customFields
) {}
