package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.CustomFieldType;
import de.tum.cit.aet.job.dto.JobFormDTO;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Re-importable representation of a {@link de.tum.cit.aet.job.domain.Job} for
 * admin bulk exports. Wraps the existing {@link JobFormDTO} (which already
 * covers every persistent job field, including the supervising-professor UUID
 * and sanitized descriptions) and only adds the few things the admin export
 * needs on top: the research group id, the custom fields attached to the job,
 * and the audit timestamps.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminJobExportDTO(
    JobFormDTO job,
    UUID researchGroupId,
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
