package de.tum.cit.aet.core.validation;

import de.tum.cit.aet.core.validation.validator.OddValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@SuppressWarnings("checkstyle:MissingJavadocMethod")
@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = OddValidator.class)
public @interface Odd {
    String message() default "must be an odd integer";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

