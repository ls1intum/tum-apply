package de.tum.cit.aet.interview.dto;

/**
 * Enumeration of possible interviewee states.
 */
public enum IntervieweeState {
    /** Applicant added to interview but not yet contacted */
    UNCONTACTED,
    /** Invitation email has been sent */
    INVITED,
    /** Interview slot has been scheduled */
    SCHEDULED,
    /** Interview has been completed */
    COMPLETED,
}
