package de.tum.cit.aet.core.validation.validator;

import de.tum.cit.aet.core.validation.Odd;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class OddValidator implements ConstraintValidator<Odd, Integer> {
    public boolean isValid(Integer value, ConstraintValidatorContext ctx) {
        return value != null && (value % 2) == 1;
    }
}
