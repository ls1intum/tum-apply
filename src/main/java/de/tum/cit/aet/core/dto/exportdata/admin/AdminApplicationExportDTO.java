package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flat, re-importable representation of an
 * {@link de.tum.cit.aet.application.domain.Application}. Includes the snapshot
 * fields the application stores at submission time, plus inline review,
 * rating, comment, custom field answer, document and interview references so
 * a single JSON file fully describes one applicant.
 *
 * <p>All sub-records are nested inside this DTO instead of living in separate
 * files — they only ever appear as part of an application export.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminApplicationExportDTO(
    UUID applicationId,
    UUID jobId,
    UUID applicantUserId,
    ApplicationState state,
    LocalDate desiredStartDate,
    LocalDateTime appliedAt,
    String motivation,
    String specialSkills,
    String projects,
    // applicant snapshot
    String applicantFirstName,
    String applicantLastName,
    String applicantEmail,
    String applicantGender,
    String applicantNationality,
    LocalDate applicantBirthday,
    String applicantPhoneNumber,
    String applicantWebsite,
    String applicantLinkedinUrl,
    String applicantStreet,
    String applicantPostalCode,
    String applicantCity,
    String applicantCountry,
    String applicantBachelorDegreeName,
    String applicantBachelorGradeUpperLimit,
    String applicantBachelorGradeLowerLimit,
    String applicantBachelorGrade,
    String applicantBachelorUniversity,
    String applicantMasterDegreeName,
    String applicantMasterGradeUpperLimit,
    String applicantMasterGradeLowerLimit,
    String applicantMasterGrade,
    String applicantMasterUniversity,
    // related data
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
