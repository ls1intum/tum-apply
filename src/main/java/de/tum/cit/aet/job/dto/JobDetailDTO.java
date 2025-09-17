package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobDetailDTO(
    @NotNull UUID jobId,
    @NotNull String supervisingProfessorName,
    @NotNull ResearchGroup researchGroup,
    @NotNull String title,
    String fieldOfStudies,
    String researchArea,
    String location,
    Integer workload,
    Integer contractDuration,
    String fundingType,
    String description,
    String tasks,
    String requirements,
    LocalDate startDate,
    LocalDate endDate,
    @NotNull LocalDateTime createdAt,
    @NotNull LocalDateTime lastModifiedAt,
    JobState state,
    UUID applicationId,
    ApplicationState applicationState
    // TODO: Adjust this to a List of CustomFields
    // CustomField customFields
) {
    public JobDetailDTO(
        @NotNull UUID jobId,
        @NotNull String supervisingProfessorName,
        @NotNull ResearchGroup researchGroup,
        @NotNull String title,
        String fieldOfStudies,
        String researchArea,
        Campus location,
        Integer workload,
        Integer contractDuration,
        FundingType fundingType,
        String description,
        String tasks,
        String requirements,
        LocalDate startDate,
        LocalDate endDate,
        @NotNull LocalDateTime createdAt,
        @NotNull LocalDateTime lastModifiedAt,
        JobState state,
        UUID applicationId,
        ApplicationState applicationState
    ) {
        this(
            jobId,
            supervisingProfessorName,
            researchGroup,
            title,
            fieldOfStudies,
            researchArea,
            UiTextFormatter.formatEnumValue(location),
            workload,
            contractDuration,
            UiTextFormatter.formatEnumValue(fundingType),
            description,
            tasks,
            requirements,
            startDate,
            endDate,
            createdAt,
            lastModifiedAt,
            state,
            applicationId,
            applicationState
        );
    }
}
