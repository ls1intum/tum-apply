package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.ai.service.ComplianceIssue;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.constants.SubjectArea;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobDTO(
    @NotNull UUID jobId,
    @NotNull String title,
    String researchArea,
    SubjectArea subjectArea,
    @NotNull UUID supervisingProfessor,
    Campus location,
    LocalDate startDate,
    LocalDate endDate,
    Integer workload,
    Integer contractDuration,
    FundingType fundingType,
    String jobDescriptionEN,
    String jobDescriptionDE,
    @NotNull JobState state,
    UUID imageId,
    String imageUrl,
    Boolean suitableForDisabled,
    Integer genderBiasScore,
    List<ComplianceIssue> complianceIssues
) {}
