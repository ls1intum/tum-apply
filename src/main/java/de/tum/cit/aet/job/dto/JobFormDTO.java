package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobFormDTO(
    UUID jobId,
    @NotNull String title,
    String researchArea,
    @NotNull String fieldOfStudies,
    @NotNull UUID supervisingProfessor,
    @NotNull Campus location,
    LocalDate startDate,
    LocalDate endDate,
    Integer workload,
    Integer contractDuration,
    FundingType fundingType,
    String description,
    String tasks,
    String requirements,
    @NotNull JobState state
) {
    /**
     * @param job The job entity to convert
     * @return A JobFormDTO containing the data from the job entity.
     */
    public static JobFormDTO getFromEntity(Job job) {
        if (job == null) {
            throw new EntityNotFoundException("Cannot convert non-existent Job entity to JobFormDTO");
        }
        return new JobFormDTO(
            job.getJobId(),
            job.getTitle(),
            job.getResearchArea(),
            job.getFieldOfStudies(),
            job.getSupervisingProfessor().getUserId(),
            job.getLocation(),
            job.getStartDate(),
            job.getEndDate(),
            job.getWorkload(),
            job.getContractDuration(),
            job.getFundingType(),
            job.getDescription(),
            job.getTasks(),
            job.getRequirements(),
            job.getState()
        );
    }
}
