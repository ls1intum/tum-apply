package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.CustomFieldType;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.constants.SubjectArea;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flat, re-importable representation of a {@link de.tum.cit.aet.job.domain.Job}.
 * Foreign keys are stored as ids so the JSON shape can be replayed back into
 * the database without resolving fragile object references.
 *
 * <p>The custom field record is nested rather than living in its own file —
 * it is only meaningful in the context of a job and is never serialized on
 * its own.
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
    List<CustomField> customFields,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {
    /** Flat representation of a {@link de.tum.cit.aet.job.domain.CustomField}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomField(
        UUID customFieldId,
        String question,
        boolean required,
        CustomFieldType customFieldType,
        List<String> answerOptions,
        int sequence
    ) {}
}
