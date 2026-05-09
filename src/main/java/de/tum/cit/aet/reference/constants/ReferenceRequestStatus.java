package de.tum.cit.aet.reference.constants;

/**
 * Lifecycle states of a reference request opened by an applicant.
 *
 * REQUESTED  invitation has been sent.
 * SUBMITTED  referee uploaded the letter.
 * EXPIRED    deadline passed without submission.
 */
public enum ReferenceRequestStatus {
    REQUESTED,
    SUBMITTED,
    EXPIRED,
}
