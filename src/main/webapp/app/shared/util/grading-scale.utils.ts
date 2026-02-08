import { AbstractControl } from '@angular/forms';

export type GradeType = 'letter' | 'numeric' | 'percentage' | 'invalid';

export interface GradingScaleLimitsData {
  upperLimit: string;
  lowerLimit: string;
  isPercentage?: boolean;
}

export type GradingScaleLimitsResult = GradingScaleLimitsData | null;

/**
 * Determines the type of a grade (letter, numeric, percentage or invalid)
 */
export function getGradeType(value: string): GradeType {
  if (!value || value.trim() === '') {
    return 'invalid';
  }

  const trimmed = value.trim();

  // Check for letter grade (A-Z with optional +/-/*)
  if (/^[A-Z]([+\-*])?$/i.test(trimmed)) {
    return 'letter';
  }

  // Check for percentage (digits with optional comma/dot followed by %)
  if (/^(?:[0-9]{1,10}|[0-9]{1,10}[.,][0-9]{1,2})%$/.test(trimmed)) {
    return 'percentage';
  }

  // Check for numeric grade (digits with optional comma/dot)
  if (/^[0-9]+([.,][0-9]+)?$/.test(trimmed)) {
    return 'numeric';
  }

  return 'invalid';
}

/**
 * Strips the % sign from a percentage value
 */
export function stripPercentage(value: string): string {
  return value.replace('%', '').trim();
}

/**
 * Adds % sign to a value
 */
export function addPercentage(value: string): string {
  if (value.endsWith('%')) return value;
  return `${value}%`;
}

/**
 * Converts a letter grade to a numerical value for comparison
 * A=1, A+=0.7, A-=1.3, B=2, B+=1.7, B-=2.3, etc.
 */
export function getLetterValue(letter: string): number {
  const match = letter.match(/^([A-Z])([+\-*])?$/);
  if (!match) return 999;

  const baseLetter = match[1];
  const modifier = match[2];

  let value = baseLetter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;

  if (modifier === '+' || modifier === '*') {
    value -= 0.3;
  } else if (modifier === '-') {
    value += 0.3;
  }

  return value;
}

/**
 * Checks if a letter grade is within the specified range
 */
export function isLetterInRange(grade: string, upper: string, lower: string): boolean {
  const gradeValue = getLetterValue(grade.trim().toUpperCase());
  const upperValue = getLetterValue(upper.trim().toUpperCase());
  const lowerValue = getLetterValue(lower.trim().toUpperCase());

  if (upperValue < lowerValue) {
    return gradeValue >= upperValue && gradeValue <= lowerValue;
  } else {
    return gradeValue >= lowerValue && gradeValue <= upperValue;
  }
}

/**
 * Checks if a numeric/percentage grade is within the specified range
 */
export function isNumericInRange(grade: string, upper: string, lower: string): boolean {
  // Strip % for comparison
  const gradeValue = parseFloat(stripPercentage(grade).replace(',', '.'));
  const upperValue = parseFloat(stripPercentage(upper).replace(',', '.'));
  const lowerValue = parseFloat(stripPercentage(lower).replace(',', '.'));

  if (isNaN(gradeValue) || isNaN(upperValue) || isNaN(lowerValue)) {
    return false;
  }

  if (upperValue < lowerValue) {
    return gradeValue >= upperValue && gradeValue <= lowerValue;
  } else {
    return gradeValue >= lowerValue && gradeValue <= upperValue;
  }
}

/**
 * Detects if a grade is a letter grade
 */
export function detectLetterGrade(grade: string): GradingScaleLimitsResult {
  const letterMatch = grade.match(/^([A-Z])([+\-*])?$/);
  if (!letterMatch) {
    return null;
  }

  const letter = letterMatch[1];
  const modifier = letterMatch[2];

  // If letter contains a modifier, add + to the upper bound
  const hasModifier = modifier === '+' || modifier === '-' || modifier === '*';
  const upperBound = hasModifier ? 'A+' : 'A';

  // If letter is between A and E, propose common range A to E
  if (letter >= 'A' && letter <= 'E') {
    return { upperLimit: upperBound, lowerLimit: 'E' };
  }

  // All other letters are uncommon, propose range A to the letter itself
  return { upperLimit: upperBound, lowerLimit: letter };
}

/**
 * Grading scale definitions for numeric grades
 */
const NUMERIC_GRADING_SCALES = [
  { maxValue: 4.0, upperLimit: '1.0', lowerLimit: '4.0', inclusive: true }, // Cover range from 1.0 to 4.0 (f.e. German system)
  { maxValue: 6.0, upperLimit: '6.0', lowerLimit: '4.0', inclusive: true }, // Cover range from 4.0 to 6.0 (f.e. Swiss system)
  { maxValue: 10.0, upperLimit: '10', lowerLimit: '5', inclusive: true }, // Cover range from 6.0 to 10.0 (f.e. Spanish system)
  { maxValue: 20.0, upperLimit: '20', lowerLimit: '10', inclusive: true }, // Cover range from 10.0 to 20.0 (f.e. French system)
  { maxValue: 40.0, upperLimit: '40', lowerLimit: '20', inclusive: false }, // Cover range from 20.0 to 40.0 (no known systems, propose 40 - 20 for this range. Exclude 40 from this range as it's more likely to be the percentage range 100 - 40)
  { maxValue: 50.0, upperLimit: '100', lowerLimit: '40', inclusive: false }, // Cover range from 40.0 to 50.0 (f.e. percentage based systems => percentage 100 to 50 is more likely which is why this range is limited to 50)
  { maxValue: 100.0, upperLimit: '100', lowerLimit: '50', inclusive: true }, // Cover range from 50.0 to 100.0 (f.e. percentage based systems)
  { maxValue: 110.0, upperLimit: '110', lowerLimit: '66', inclusive: true }, // Cover range from 100.0 to 110.0 (f.e. Italian system)
] as const;

/**
 * Detects if a grade is a numeric grade and returns appropriate limits
 */
export function detectNumericGrade(grade: string): GradingScaleLimitsResult {
  const normalizedValue = grade.replace(',', '.');

  // Check if it's a percentage
  const isPercentage = grade.endsWith('%');
  const valueToCheck = isPercentage ? stripPercentage(grade) : grade;

  // Validate format: only numbers with optional comma/dot
  if (!/^[0-9]+([.,][0-9]+)?$/.test(valueToCheck)) {
    return null;
  }

  const numericValue = parseFloat(isPercentage ? stripPercentage(normalizedValue) : normalizedValue);

  // Ignore values below 1
  if (isNaN(numericValue) || numericValue < 1) {
    return null;
  }

  // Find the first matching scale
  for (const scale of NUMERIC_GRADING_SCALES) {
    const matches = !scale.inclusive ? numericValue < scale.maxValue : numericValue <= scale.maxValue;

    if (matches) {
      // Add % if original grade had it
      return {
        upperLimit: isPercentage ? addPercentage(scale.upperLimit) : scale.upperLimit,
        lowerLimit: isPercentage ? addPercentage(scale.lowerLimit) : scale.lowerLimit,
        isPercentage,
      };
    }
  }

  // Values above 110: Propose range from value to value/2
  const lowerLimit = Math.round(numericValue / 2);
  return {
    upperLimit: isPercentage ? addPercentage(numericValue.toString()) : numericValue.toString(),
    lowerLimit: isPercentage ? addPercentage(lowerLimit.toString()) : lowerLimit.toString(),
    isPercentage,
  };
}

/**
 * Detects the grading scale based on a grade input
 */
export function detectGradingScale(grade: string): GradingScaleLimitsResult {
  if (!grade || grade.trim() === '') {
    return null;
  }

  const trimmedGrade = grade.trim().toUpperCase();

  // Ignore multiple letters without modifiers
  if (/^[A-Z]{2,}$/.test(trimmedGrade)) {
    return null;
  }

  // Check for letter grades
  const letterResult = detectLetterGrade(trimmedGrade);
  if (letterResult) {
    return letterResult;
  }

  // Check for numeric/percentage grades
  return detectNumericGrade(trimmedGrade);
}
/**
 * Normalizes grading scale limits based on the format of the given grade.
 *
 * If the grade is a percentage, ensures both limits include a '%' sign.
 * If the grade is not a percentage, removes any '%' sign from the limits.
 */
export function normalizeLimitsForGrade(grade: string, limits: GradingScaleLimitsData): GradingScaleLimitsData {
  const gradeType = getGradeType(grade);

  if (gradeType !== 'percentage') {
    return {
      ...limits,
      upperLimit: stripPercentage(limits.upperLimit),
      lowerLimit: stripPercentage(limits.lowerLimit),
      isPercentage: false,
    };
  }

  return {
    ...limits,
    upperLimit: addPercentage(stripPercentage(limits.upperLimit)),
    lowerLimit: addPercentage(stripPercentage(limits.lowerLimit)),
    isPercentage: true,
  };
}

/**
 * Sets or removes a specific error on a FormControl without affecting other errors
 */
export function setControlError(control: AbstractControl, errorKey: string, hasError: boolean): void {
  const currentErrors = control.errors ?? {};

  if (hasError) {
    // Add the error
    control.setErrors({ ...currentErrors, [errorKey]: true });
  } else {
    // Remove the error
    const errors = { ...currentErrors };
    control.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }
}
