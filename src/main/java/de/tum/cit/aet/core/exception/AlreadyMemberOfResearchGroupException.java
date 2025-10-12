package de.tum.cit.aet.core.exception;

/**
 * Thrown when an operation requires the user to not belong to any research group,
 * but the current user already has a research group assigned.
 */
public class AlreadyMemberOfResearchGroupException extends RuntimeException {

    public AlreadyMemberOfResearchGroupException(String message) {
        super(message);
    }

    public AlreadyMemberOfResearchGroupException(String message, Throwable cause) {
        super(message, cause);
    }
}
