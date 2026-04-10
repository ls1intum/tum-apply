package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import java.time.Instant;
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
 * and only adds the application-level fields plus the review / rating /
 * comment / custom-field-answer / document / interview sub-records.
 *
 * <p>All sub-records are nested inside this DTO instead of living in separate
 * files — they only ever appear as part of an application export.
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
    Review review,
    List<Rating> ratings,
    List<InternalComment> internalComments,
    List<CustomFieldAnswer> customFieldAnswers,
    List<DocumentRef> documents,
    Interview interview,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {
    /** Flat representation of an {@link de.tum.cit.aet.evaluation.domain.ApplicationReview}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Review(UUID applicationReviewId, UUID reviewedByUserId, String reason, LocalDateTime reviewedAt) {}

    /** Flat representation of a {@link de.tum.cit.aet.evaluation.domain.Rating}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Rating(UUID ratingId, UUID fromUserId, Integer rating, LocalDateTime createdAt) {}

    /** Flat representation of an {@link de.tum.cit.aet.evaluation.domain.InternalComment}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record InternalComment(UUID internalCommentId, UUID authorUserId, String message, LocalDateTime createdAt) {}

    /** Flat representation of a {@link de.tum.cit.aet.application.domain.CustomFieldAnswer}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record CustomFieldAnswer(UUID customFieldAnswerId, UUID customFieldId, List<String> answers) {}

    /**
     * Reference to an applicant document inside the export ZIP. {@code zipPath}
     * points to the location of the actual file within this archive (e.g.
     * {@code documents/cv.pdf}).
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DocumentRef(UUID documentId, String name, DocumentType documentType, String mimeType, Long sizeBytes, String zipPath) {}

    /**
     * Flat representation of an {@link de.tum.cit.aet.interview.domain.Interviewee}
     * along with its scheduled slots.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Interview(
        UUID intervieweeId,
        UUID interviewProcessId,
        Instant lastInvited,
        AssessmentRating rating,
        String assessmentNotes,
        List<Slot> slots
    ) {
        /** Flat representation of an {@link de.tum.cit.aet.interview.domain.InterviewSlot}. */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public record Slot(UUID slotId, Instant startDateTime, Instant endDateTime, String location, String streamLink, Boolean booked) {}
    }
}
