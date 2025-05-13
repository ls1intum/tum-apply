package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobFormDTO(
    String title,
    String researchArea,
    String fieldOfStudies,
    @NotNull UUID supervisingProfessor,
    @NotNull Campus location,
    LocalDate startDate,
    Integer workload,
    Integer contractDuration,
    @NotNull FundingType fundingType,
    String description,
    String tasks,
    String requirements,
    @NotNull JobState state
) {}
