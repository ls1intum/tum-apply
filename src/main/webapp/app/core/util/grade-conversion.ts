import { isLetter, isNumeric, isPercentage, parseNumeric } from './grade-format.validator';

/**
 * Converts a grade to the German grading system (1.0 - 4.0) using the modified Bavarian formula.
 * Formula: X = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
 *
 * Where:
 * - X = converted German grade
 * - Nmax = upper limit (best grade in the original system)
 * - Nmin = lower limit (minimum passing grade in the original system)
 * - Nd = actual grade to convert
 *
 * @param upperLimit - The best possible grade in the original grading system
 * @param lowerLimit - The minimum passing grade in the original grading system
 * @param grade - The actual grade to convert
 * @returns The converted grade in German system (1.0 - 4.0) or null if conversion fails
 */
export function convertToGermanGrade(upperLimit: string, lowerLimit: string, grade: string): number | null {
  if (!upperLimit || !lowerLimit || !grade) {
    return null;
  }

  // Determine the format type
  let nMax: number;
  let nMin: number;
  let nd: number;

  if (isPercentage(upperLimit) && isPercentage(lowerLimit) && isPercentage(grade)) {
    // Percentage format (e.g., 100%, 50%)
    nMax = parseNumeric(upperLimit);
    nMin = parseNumeric(lowerLimit);
    nd = parseNumeric(grade);
  } else if (isNumeric(upperLimit) && isNumeric(lowerLimit) && isNumeric(grade)) {
    // Numeric format (e.g., 1.0, 4.0 or 100, 40)
    nMax = parseNumeric(upperLimit);
    nMin = parseNumeric(lowerLimit);
    nd = parseNumeric(grade);
  } else if (isLetter(grade)) {
    // Letter format (e.g., A+, A, B)
    // Convert letters to numerical values
    const letterValues = convertLettersToNumerical(upperLimit, lowerLimit, grade);
    if (!letterValues) {
      return null;
    }
    nMax = letterValues.max;
    nMin = letterValues.min;
    nd = letterValues.current;
  } else {
    // Mixed or invalid format
    return null;
  }

  // Validate that the grade is within the limits
  const isInRange = validateGradeInRange(nMax, nMin, nd);
  if (!isInRange) {
    return null;
  }

  // Apply the modified Bavarian formula
  // X = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
  const denominator = nMax - nMin;

  if (denominator === 0) {
    // Edge case: if max equals min, cannot convert
    return null;
  }

  const germanGrade = 1 + 3 * ((nMax - nd) / denominator);

  // Truncate to one decimal place and clamp the value to the valid German grade range (1.0–4.0)
  const rounded = Math.floor(germanGrade * 10) / 10;

  // Clamp to valid German grade range
  return Math.max(1.0, Math.min(4.0, rounded));
}

/**
 * Converts letter grades (e.g., A+, A, B, C, D, E) into numerical values for conversion purposes.
 * A+ is the highest (= 1), followed by A (= 2), B (= 3), and so on.
 * Also supports A* as a synonym for A+.
 */
function convertLettersToNumerical(
  upperLimit: string,
  lowerLimit: string,
  grade: string,
): { max: number; min: number; current: number } | null {
  const allGrades = generateLetterScale(upperLimit, lowerLimit);

  const maxValue = allGrades.get(normalizeLetter(upperLimit));
  const minValue = allGrades.get(normalizeLetter(lowerLimit));
  const currentValue = allGrades.get(normalizeLetter(grade));

  if (maxValue === undefined || minValue === undefined || currentValue === undefined) {
    return null;
  }

  return { max: maxValue, min: minValue, current: currentValue };
}

/**
 * Normalize input letters (f.e. 'a+' → 'A+', 'a*' → 'A+').
 */
function normalizeLetter(letter: string): string {
  return letter.trim().toUpperCase().replace('*', '+');
}

function generateLetterScale(upperLimit: string, lowerLimit: string): Map<string, number> {
  const upper = normalizeLetter(upperLimit);
  const lower = normalizeLetter(lowerLimit);

  const upperLetter = upper.charAt(0);
  const lowerLetter = lower.charAt(0);
  const upperModifier = upper.length > 1 ? upper.charAt(1) : '';

  const start = upperLetter.charCodeAt(0);
  const end = lowerLetter.charCodeAt(0);

  const map = new Map<string, number>();
  let currentValue = 1;

  // Handle the first letter (upper limit) specially
  const firstLetter = String.fromCharCode(start);

  if (upperModifier === '+') {
    // Upper limit has +: A+ = 1, A = 2, A- = 2.3
    map.set(`${firstLetter}+`, currentValue);
    currentValue = 2;
    map.set(firstLetter, currentValue);
    currentValue = 2.3;
    map.set(`${firstLetter}-`, currentValue);
    currentValue = 2.7;
  } else if (upperModifier === '-') {
    // Upper limit has -: A- = 1, B+ = 1.5
    map.set(`${firstLetter}-`, currentValue);
    currentValue = 1.5;
  } else {
    // Upper limit has no modifier: A = 1, A- = 1.3
    map.set(firstLetter, currentValue);
    currentValue = 1.3;
    map.set(`${firstLetter}-`, currentValue);
    currentValue = 1.7;
  }

  // Handle remaining letters
  for (let code = start + 1; code <= end; code++) {
    const letter = String.fromCharCode(code);

    // Special case: if upper limit was -, add 0.5 for the first B+
    if (code === start + 1 && upperModifier === '-') {
      map.set(`${letter}+`, currentValue);
      currentValue = 2;
    } else {
      map.set(`${letter}+`, currentValue);
      currentValue = Math.round((currentValue + 0.3) * 10) / 10;
    }

    map.set(letter, currentValue);
    currentValue = Math.round((currentValue + 0.3) * 10) / 10;

    map.set(`${letter}-`, currentValue);
    currentValue = Math.round((currentValue + 0.4) * 10) / 10;
  }

  return map;
}

/**
 * Validates that the grade is within the specified range.
 * Handles both ascending (1.0-4.0) and descending (100-40) scales.
 *
 * @param max - Upper limit value
 * @param min - Lower limit value
 * @param grade - Grade value to check
 * @returns true if grade is within range, false otherwise
 */
function validateGradeInRange(max: number, min: number, grade: number): boolean {
  if (max > min) {
    // Descending scale (e.g., 100 to 40, or A+ to D where A+=1, D=5)
    return grade >= min && grade <= max;
  } else {
    // Ascending scale (e.g., 1.0 to 4.0)
    return grade >= max && grade <= min;
  }
}

/**
 * Formats a German grade for display with one decimal place.
 *
 * @param grade - German grade (1.0 - 4.0)
 * @returns Formatted grade string
 */
export function formatGrade(grade: number | null): string | null {
  if (grade === null) {
    return null;
  }

  // Format with German decimal separator (comma)
  return grade.toFixed(1);
}

/**
 * Converts and formats a grade to German system in one step.
 *
 * @param upperLimit - Best possible grade
 * @param lowerLimit - Minimum passing grade
 * @param grade - Actual grade to convert
 * @returns Formatted German grade string or null
 */
export function convertAndFormatGermanGrade(
  upperLimit: string | undefined,
  lowerLimit: string | undefined,
  grade: string | undefined,
): string | null {
  if (!upperLimit || !lowerLimit || !grade) {
    return null;
  }

  const converted = convertToGermanGrade(upperLimit, lowerLimit, grade);
  return formatGrade(converted);
}

/**
 * Returns the converted German grade as a string.
 *
 * @param upperLimit - Best possible grade
 * @param lowerLimit - Minimum passing grade
 * @param grade - Actual grade to convert
 * @returns Converted German grade as string, or empty string if conversion fails or grade is undefined
 */
export function displayGradeWithConversion(
  upperLimit: string | undefined,
  lowerLimit: string | undefined,
  grade: string | undefined,
): string {
  if (!grade) {
    return '';
  }

  const germanGrade = convertAndFormatGermanGrade(upperLimit, lowerLimit, grade);

  return germanGrade ?? '';
}
