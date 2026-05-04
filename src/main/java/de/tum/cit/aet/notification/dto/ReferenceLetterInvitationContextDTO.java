package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Context for the {@code REFERENCE_LETTER_INVITATION} email sent to an external referee.
 *
 * @param refereeFirstName        the referee's first name
 * @param refereeLastName         the referee's last name
 * @param applicantFirstName      the applicant who requested the letter
 * @param applicantLastName       the applicant who requested the letter
 * @param jobTitle                the job the application is for
 * @param researchGroupName       the research group running the position
 * @param referenceLink           the tokenized URL the referee uses to upload the letter
 * @param referenceDeadline       human-readable deadline (e.g. dd.MM.yyyy) by which the letter must be uploaded
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReferenceLetterInvitationContextDTO(
    String refereeFirstName,
    String refereeLastName,
    String applicantFirstName,
    String applicantLastName,
    String jobTitle,
    String researchGroupName,
    String referenceLink,
    String referenceDeadline
) {}
