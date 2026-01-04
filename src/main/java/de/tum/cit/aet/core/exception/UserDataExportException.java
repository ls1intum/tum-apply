package de.tum.cit.aet.core.exception;

/**
 * Thrown when exporting user data fails.
 */
public class UserDataExportException extends InternalServerException {

    public UserDataExportException(String message) {
        super(message);
    }

    public UserDataExportException(String message, Throwable cause) {
        super(message, cause);
    }
}
