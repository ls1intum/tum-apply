import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { getGradeType, isLetterInRange, isNumericInRange, setControlError } from 'app/shared/util/grading-scale.utils';

/**
 * Validator for a single grading scale limit (upper or lower).
 *
 * Ensures that the limit has the same format/type as the current grade
 * (e.g. numeric vs. letter-based grading).
 */
export function gradingScaleTypeValidator(getCurrentGrade: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const limit = control.value.trim();
    const grade = getCurrentGrade().trim();

    if (!limit || !grade) {
      return null;
    }

    const gradeType = getGradeType(grade);
    const limitType = getGradeType(limit);

    if (limitType !== gradeType) {
      return { invalidLimitType: true };
    }

    return null;
  };
}

/**
 * Cross-field validator for grading scale limits.
 *
 * Validates that the current grade lies within the range defined by
 * upperLimit and lowerLimit.
 */
export function gradingScaleRangeValidator(getCurrentGrade: () => string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const upperCtrl = group.get('upperLimit');
    const lowerCtrl = group.get('lowerLimit');

    if (!upperCtrl || !lowerCtrl) {
      return null;
    }

    if (upperCtrl.hasError('invalidLimitType') || lowerCtrl.hasError('invalidLimitType')) {
      setControlError(upperCtrl, 'outOfRange', false);
      setControlError(lowerCtrl, 'outOfRange', false);
      return null;
    }

    const upper = upperCtrl.value.trim();
    const lower = lowerCtrl.value.trim();
    const grade = getCurrentGrade().trim();

    if (!upper || !lower || !grade) {
      setControlError(upperCtrl, 'outOfRange', false);
      setControlError(lowerCtrl, 'outOfRange', false);
      return null;
    }

    const type = getGradeType(grade);

    let inRange = false;
    if (type === 'letter') {
      inRange = isLetterInRange(grade, upper, lower);
    } else if (type === 'numeric') {
      inRange = isNumericInRange(grade, upper, lower);
    }

    if (!inRange) {
      const currentUpperErrors = upperCtrl.errors ?? {};
      const currentLowerErrors = lowerCtrl.errors ?? {};

      upperCtrl.setErrors({ ...currentUpperErrors, outOfRange: true });
      lowerCtrl.setErrors({ ...currentLowerErrors, outOfRange: true });

      return { outOfRange: true };
    } else {
      setControlError(upperCtrl, 'outOfRange', false);
      setControlError(lowerCtrl, 'outOfRange', false);
    }

    return null;
  };
}
