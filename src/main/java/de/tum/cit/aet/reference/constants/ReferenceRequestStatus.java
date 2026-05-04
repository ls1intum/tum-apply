package de.tum.cit.aet.reference.constants;

/**
 * Lifecycle states of a reference request opened by an applicant.
 *
 * REQUESTED  invitation has been sent, referee has not yet opened the link.
 * OPENED     referee opened the link at least once.
 * SUBMITTED  referee uploaded the letter and confirmed authorship.
 * WITHDRAWN  applicant removed the contact after submission.
 * EXPIRED    deadline passed without submission.
 */
public enum ReferenceRequestStatus {
    REQUESTED,
    OPENED,
    SUBMITTED,
    WITHDRAWN,
    EXPIRED,
}
