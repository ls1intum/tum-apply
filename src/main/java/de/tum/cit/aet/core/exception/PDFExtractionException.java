package de.tum.cit.aet.core.exception;

/**
 * Thrown when a PDF document cannot be converted or parsed
 */
public class PDFExtractionException extends RuntimeException {

    public PDFExtractionException(String message, Throwable cause) {
        super(message, cause);
    }
}
