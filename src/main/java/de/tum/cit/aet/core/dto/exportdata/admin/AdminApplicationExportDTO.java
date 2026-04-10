package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.CustomFieldAnswerDetailDTO;
import de.tum.cit.aet.core.dto.DocumentRefDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationReviewDTO;
import de.tum.cit.aet.evaluation.dto.InternalCommentDetailDTO;
import de.tum.cit.aet.evaluation.dto.RatingDetailDTO;
import de.tum.cit.aet.interview.dto.InterviewDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Re-importable representation of an
 * {@link de.tum.cit.aet.application.domain.Application} for admin bulk exports.
 * Wraps the existing {@link ApplicantDTO} (which — built via
 * {@link ApplicantDTO#getFromApplicationSnapshot} — already covers every
 * applicant snapshot field including the embedded {@link de.tum.cit.aet.usermanagement.dto.UserDTO})
 * and only adds the application-level fields plus references to flat
 * sub-DTOs that live in their respective domain packages.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminApplicationExportDTO(
    UUID applicationId,
    UUID jobId,
    ApplicationState state,
    LocalDate desiredStartDate,
    LocalDateTime appliedAt,
    String motivation,
    String specialSkills,
    String projects,
    ApplicantDTO applicant,
    ApplicationReviewDTO review,
    List<RatingDetailDTO> ratings,
    List<InternalCommentDetailDTO> internalComments,
    List<CustomFieldAnswerDetailDTO> customFieldAnswers,
    List<DocumentRefDTO> documents,
    InterviewDTO interview,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
