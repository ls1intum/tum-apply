package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flat, re-importable representation of an {@link de.tum.cit.aet.application.domain.Application}.
 * Includes the snapshot fields the application stores at submission time, plus inline review,
 * rating, interview and document references so a single JSON file fully describes one applicant.
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
    AdminApplicationReviewDTO review,
    List<AdminRatingDTO> ratings,
    List<AdminInternalCommentDTO> internalComments,
    List<AdminCustomFieldAnswerDTO> customFieldAnswers,
    List<AdminDocumentRefDTO> documents,
    AdminIntervieweeDTO interview,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
