import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Checks if a value is a numeric grade (e.g., "1", "1.5", "1,5")
 */
export function isNumeric(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+$/.test(trimmed) || /^\d+[.,]\d{1,2}$/.test(trimmed);
}

/**
 * Checks if a value is a letter grade (e.g., "A", "B+", "C-")
 */
export function isLetter(val: string): boolean {
  return /^[A-Za-z][+-]?$/.test(val.trim());
}

/**
 * Checks if a value is a percentage grade (e.g., "85%", "92.5%", "88,3%")
 */
export function isPercentage(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+%$/.test(trimmed) || /^\d+[.,]\d{1,2}%$/.test(trimmed);
}

/**
 * Removes +/- modifiers from letter grades and converts to uppercase
 */
export function cleanLetter(val: string): string {
  return val.replace(/[+-]/g, '').toUpperCase().trim();
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
 * Validates the format of multiple grade controls
 */
export function validateFormat(ctrls: (AbstractControl | null)[], formats: ((val: string) => boolean)[]): string | null {
  for (const ctrl of ctrls) {
    const val = ctrl?.value;
    if (!val) continue;

    if (hasTooManyDecimals(val)) {
      toggleError(ctrl, 'tooManyDecimals', true);
      return 'tooManyDecimals';
    }

    const isValid = formats.some(fn => fn(val));
    toggleError(ctrl, 'invalidGrade', !isValid);
    toggleError(ctrl, 'tooManyDecimals', false);

    if (!isValid) return 'invalidGrade';
  }
  return null;
}

/**
 * Determines if all values share the same format (numeric, letter, or percentage)
 */
export function validateSameFormat(values: string[]): 'numeric' | 'letter' | 'percentage' | null {
  if (values.every(isNumeric)) return 'numeric';
  if (values.every(isLetter)) return 'letter';
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
  if (upperClean > lowerClean) return true;

  if (upperClean === lowerClean) {
    const upperSign = upper.slice(-1);
    const lowerSign = lower.slice(-1);

    return (!/[+-]/.test(upperSign) && lowerSign === '+') || (upperSign === '-' && (lowerSign === '+' || !/[+-]/.test(lowerSign)));
  }

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

  const sameAsUpper = gradeClean === upperClean;
  const sameAsLower = gradeClean === lowerClean;

  let forbidden = false;

  if (sameAsUpper) {
    if (upper.endsWith('-') && (!/[+-]$/.test(grade) || grade.endsWith('+'))) forbidden = true;
    else if (!/[+-]$/.test(upper) && grade.endsWith('+')) forbidden = true;
  }

  if (sameAsLower) {
    if (lower.endsWith('+') && (!/[+-]$/.test(grade) || grade.endsWith('-'))) forbidden = true;
    else if (!/[+-]$/.test(lower) && grade.endsWith('-')) forbidden = true;
  }

  return outside || forbidden;
}

/**
 * Angular FormGroup validator for grade format validation
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
    const formatErr = validateFormat([upper, lower, grade], [isNumeric, isLetter, isPercentage]);
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
