package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.dto.JobFormDTO;
import java.time.Instant;
import java.util.UUID;

/**
 * Re-importable representation of a {@link de.tum.cit.aet.job.domain.Job} for
 * admin bulk exports. Wraps the existing {@link JobFormDTO} (which already
 * covers every persistent job field, including the supervising-professor UUID
 * and sanitized descriptions) and only adds the few things the admin export
 * needs on top: the research group id and the audit timestamps.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminJobExportDTO(JobFormDTO job, UUID researchGroupId, Instant createdAt, Instant lastModifiedAt) {}
