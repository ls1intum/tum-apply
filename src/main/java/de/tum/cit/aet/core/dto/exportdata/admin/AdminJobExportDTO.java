package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.constants.SubjectArea;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flat, re-importable representation of a {@link de.tum.cit.aet.job.domain.Job}.
 * Foreign keys are stored as ids so the JSON shape can be replayed back into the
 * database without resolving fragile object references.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminJobExportDTO(
    UUID jobId,
    UUID supervisingProfessorId,
    UUID researchGroupId,
    String title,
    JobState state,
    SubjectArea subjectArea,
    String researchArea,
    Campus location,
    Integer workload,
    Integer contractDuration,
    FundingType fundingType,
    String jobDescriptionEN,
    String jobDescriptionDE,
    LocalDate startDate,
    LocalDate endDate,
    Boolean suitableForDisabled,
    List<AdminCustomFieldDTO> customFields,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
