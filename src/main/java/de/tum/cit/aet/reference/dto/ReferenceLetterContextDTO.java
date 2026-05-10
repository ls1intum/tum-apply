package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import java.time.LocalDateTime;

/**
 * Context returned to a referee opening their tokenized invitation link. The token is the only
 * authentication for this endpoint, so the response intentionally exposes only data the referee
 * already knows (their own name, the applicant's name, the job title) plus the deadline.
 *
 * @param refereeTitle      academic title of the referee, may be {@code null}
 * @param refereeFirstName  first name of the referee
 * @param refereeLastName   last name of the referee
 * @param applicantFirstName first name of the applicant who requested the letter
 * @param applicantLastName  last name of the applicant who requested the letter
 * @param jobTitle          title of the job the applicant is applying to
 * @param researchGroupName name of the research group running the position
 * @param deadline          deadline by which the referee must upload the letter
 * @param status            current request status (controls whether the upload form is shown)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReferenceLetterContextDTO(
    String refereeTitle,
    String refereeFirstName,
    String refereeLastName,
    String applicantFirstName,
    String applicantLastName,
    String jobTitle,
    String researchGroupName,
    LocalDateTime deadline,
    ReferenceRequestStatus status
) {}
