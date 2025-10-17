import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Checks if a value is a numeric grade (e.g., "1", "1.5", "1,5")
 */
export function isNumeric(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+$/.test(trimmed) || /^\d+[.,]\d{1,2}$/.test(trimmed);
}

/**
 * Checks if a value is a valid upper limit letter grade.
 * Allows base letter or letter with + or * modifier (e.g., "A", "A+", "A*")
 */
export function isUpperLimitLetter(val: string): boolean {
  return /^[A-Za-z][+*]?$/.test(val.trim());
}

/**
 * Checks if a value is a valid lower limit or grade letter.
 * Only allows base letters without modifiers (e.g., "D", "E")
 */
export function isLowerLimitOrGradeLetter(val: string): boolean {
  return /^[A-Za-z]$/.test(val.trim());
}

/**
 * Checks if a value is a percentage grade (e.g., "85%", "92.5%", "88,3%")
 */
export function isPercentage(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+%$/.test(trimmed) || /^\d+[.,]\d{1,2}%$/.test(trimmed);
}

/**
 * Removes +/* modifiers from letter grades and converts to uppercase
 */
export function cleanLetter(val: string): string {
  return val.replace(/[+*]/g, '').toUpperCase().trim();
}

/**
 * Parses a numeric or percentage string to a number
 */
export function parseNumeric(val: string): number {
  return parseFloat(val.replace('%', '').replace(',', '.'));
}

/**
 * Checks if a value has more than 2 decimal places
 */
export function hasTooManyDecimals(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+[.,]\d{3,}%?$/.test(trimmed);
}

/**
 * Toggles a specific validation error on a form control
 */
export function toggleError(ctrl: AbstractControl | null | undefined, key: string, shouldSet: boolean): void {
  if (!ctrl) return;

  if (shouldSet) {
    const errors: ValidationErrors = Object.create(null);
    Object.assign(errors, ctrl.errors ?? {});
    errors[key] = true;
    ctrl.setErrors(errors);
  } else {
    if (!ctrl.errors || !(key in ctrl.errors)) return;
    const rest = Object.fromEntries(Object.entries(ctrl.errors).filter(([k]) => k !== key));
    ctrl.setErrors(Object.keys(rest).length ? rest : null);
  }
}

/**
 * Validates the format of grade controls with specific rules for upper/lower limits
 */
export function validateFormat(upper: AbstractControl | null, lower: AbstractControl | null, grade: AbstractControl | null): string | null {
  const upperVal = upper?.value;
  const lowerVal = lower?.value;
  const gradeVal = grade?.value;

  // Check upper limit
  if (upperVal) {
    if (hasTooManyDecimals(upperVal)) {
      toggleError(upper, 'tooManyDecimals', true);
      return 'tooManyDecimals';
    }

    const isValidUpper = isNumeric(upperVal) || isPercentage(upperVal) || isUpperLimitLetter(upperVal);
    toggleError(upper, 'invalidGrade', !isValidUpper);
    toggleError(upper, 'tooManyDecimals', false);

    if (!isValidUpper) return 'invalidGrade';
  }

  // Check lower limit (no modifiers allowed for letters)
  if (lowerVal) {
    if (hasTooManyDecimals(lowerVal)) {
      toggleError(lower, 'tooManyDecimals', true);
      return 'tooManyDecimals';
    }

    const isValidLower = isNumeric(lowerVal) || isPercentage(lowerVal) || isLowerLimitOrGradeLetter(lowerVal);
    toggleError(lower, 'invalidGrade', !isValidLower);
    toggleError(lower, 'tooManyDecimals', false);

    if (!isValidLower) return 'invalidGrade';
  }

  // Check grade (modifiers only allowed if grade equals upper limit)
  if (gradeVal) {
    if (hasTooManyDecimals(gradeVal)) {
      toggleError(grade, 'tooManyDecimals', true);
      return 'tooManyDecimals';
    }

    // Check if grade has modifiers
    const gradeHasModifier = /[+*]/.test(gradeVal);
    const gradeEqualsUpper = upperVal && gradeVal.trim() === upperVal.trim();

    // If grade has modifier but doesn't equal upper limit, that's invalid
    if (gradeHasModifier && !gradeEqualsUpper) {
      toggleError(grade, 'invalidModifierUsage', true);
      return 'invalidModifierUsage';
    } else {
      toggleError(grade, 'invalidModifierUsage', false);
    }

    const isValidGrade =
      isNumeric(gradeVal) ||
      isPercentage(gradeVal) ||
      (gradeEqualsUpper ? isUpperLimitLetter(gradeVal) : isLowerLimitOrGradeLetter(gradeVal));

    toggleError(grade, 'invalidGrade', !isValidGrade);
    toggleError(grade, 'tooManyDecimals', false);

    if (!isValidGrade) return 'invalidGrade';
  }

  return null;
}

/**
 * Determines if all values share the same format (numeric, letter, or percentage)
 */
export function validateSameFormat(values: string[]): 'numeric' | 'letter' | 'percentage' | null {
  if (values.every(isNumeric)) return 'numeric';
  if (values.every(v => isUpperLimitLetter(v) || isLowerLimitOrGradeLetter(v))) return 'letter';
  if (values.every(isPercentage)) return 'percentage';
  return null;
}

/**
 * Checks if upper and lower grade boundaries are logically inconsistent
 */
export function validateBoundaryMismatch(format: string, upper: string, lower: string): boolean {
  if (format === 'percentage') {
    return parseNumeric(upper) < parseNumeric(lower);
  }

  const upperClean = cleanLetter(upper);
  const lowerClean = cleanLetter(lower);

  // Upper must be "better" (earlier in alphabet) than or equal to lower
  // A < B < C, so A is better than B
  if (upperClean > lowerClean) return true;

  return false;
}

/**
 * Checks if a grade falls outside the specified range
 */
export function validateGradeRange(format: string, upper: string, lower: string, grade: string): boolean {
  if (format === 'percentage') {
    const u = parseNumeric(upper);
    const l = parseNumeric(lower);
    const g = parseNumeric(grade);
    return g < l || g > u;
  }

  if (format === 'numeric') {
    const u = parseNumeric(upper);
    const l = parseNumeric(lower);
    const g = parseNumeric(grade);
    return (l > u && (g < u || g > l)) || (u >= l && (g > u || g < l));
  }

  const upperClean = cleanLetter(upper);
  const lowerClean = cleanLetter(lower);
  const gradeClean = cleanLetter(grade);
  const outside = gradeClean < upperClean || gradeClean > lowerClean;

  return outside;
}

/**
 * Validates that upper limit, lower limit, and grade all use the same format
 * and that the grade falls within the specified range
 */
export function gradeFormatValidator(upperLimitKey: string, lowerLimitKey: string, gradeKey: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const upper = control.get(upperLimitKey);
    const lower = control.get(lowerLimitKey);
    const grade = control.get(gradeKey);

    const values = [upper?.value, lower?.value, grade?.value];
    if (values.some(v => !v)) return null;

    // Check individual format validity
    const formatErr = validateFormat(upper, lower, grade);
    if (formatErr) return { [formatErr]: true };

    // Check if all three values have the same format
    const format = validateSameFormat(values);
    if (!format) {
      [upper, lower, grade].forEach(ctrl => {
        toggleError(ctrl, 'formatMismatch', true);
      });
      return { formatMismatch: true };
    } else {
      [upper, lower, grade].forEach(ctrl => {
        toggleError(ctrl, 'formatMismatch', false);
      });
    }

    // Check if upper limit is greater than lower limit (not necessary for numeric to allow 1.0 to 4.0 (1.0<4.0) and 100 to 40 (100>40))
    if (format !== 'numeric') {
      if (validateBoundaryMismatch(format, upper!.value, lower!.value)) {
        toggleError(upper, 'boundaryMismatch', true);
        toggleError(lower, 'boundaryMismatch', true);
        return { boundaryMismatch: true };
      } else {
        toggleError(upper, 'boundaryMismatch', false);
        toggleError(lower, 'boundaryMismatch', false);
      }
    }

    // Check if grade is within the limits
    if (validateGradeRange(format, upper!.value, lower!.value, grade!.value)) {
      toggleError(grade, 'outOfRange', true);
      return { outOfRange: true };
    } else {
      toggleError(grade, 'outOfRange', false);
    }

    return null;
  };
}
