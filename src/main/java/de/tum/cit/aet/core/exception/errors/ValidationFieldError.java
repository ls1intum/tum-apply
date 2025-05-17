package de.tum.cit.aet.core.exception.errors;

import java.io.Serializable;

public class ValidationFieldError implements Serializable {

    private static final long serialVersionUID = 1L;

    private final String objectName;
    private final String field;
    private final String message;

    public ValidationFieldError(String objectName, String field, String message) {
        this.objectName = objectName;
        this.field = field;
        this.message = message;
    }

    public String getObjectName() {
        return objectName;
    }

    public String getField() {
        return field;
    }

    public String getMessage() {
        return message;
    }
}
