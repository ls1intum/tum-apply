import { describe, it, expect, beforeEach } from 'vitest';
import { FormControl } from '@angular/forms';
import {
  getGradeType,
  stripPercentage,
  addPercentage,
  getLetterValue,
  isNumericInRange,
  detectLetterGrade,
  detectNumericGrade,
  detectFractionGrade,
  detectGradingScale,
  normalizeLimitsForGrade,
  shouldShowGradeWarning,
  setControlError,
  GradingScaleLimitsData,
} from 'app/shared/util/grading-scale.utils';

describe('getGradeType', () => {
  it.each([
    ['', 'invalid'],
    ['   ', 'invalid'],
    ['!!', 'invalid'],
    ['AB', 'invalid'],
    ['A++', 'invalid'],
    ['85%%', 'invalid'],
    ['85.5++', 'invalid'],
    ['85858585858', 'invalid'],
    ['85.', 'invalid'],
    ['A', 'letter'],
    ['b', 'letter'],
    ['A+', 'letter'],
    ['B-', 'letter'],
    ['C*', 'letter'],
    ['85%', 'percentage'],
    ['85.5%', 'percentage'],
    ['85,5%', 'percentage'],
    ['3', 'numeric'],
    ['1.7', 'numeric'],
    ['2,3', 'numeric'],
    ['1000000000', 'numeric'],
    ['105/110', 'numericFraction'],
    ['85/100', 'numericFraction'],
    ['1.7/4.0', 'numericFraction'],
    ['2,3/4,0', 'numericFraction'],
    ['A/B', 'invalid'],
    ['105/', 'invalid'],
    ['/110', 'invalid'],
  ])('should classify %s as %s', (input, expected) => {
    expect(getGradeType(input)).toBe(expected);
  });
});

describe('detectFractionGrade', () => {
  it.each([
    ['105/110', { upperLimit: '110', lowerLimit: '66' }],
    ['85/100', { upperLimit: '100', lowerLimit: '50' }],
    ['15/20', { upperLimit: '20', lowerLimit: '10' }],
    ['1/3', { upperLimit: '3', lowerLimit: '2' }],
  ])('should map %s to %j', (input, expected) => {
    expect(detectFractionGrade(input)).toEqual(expected);
  });

  it.each(['105', 'A', ''])('should return null for non-fraction input %s', input => {
    expect(detectFractionGrade(input)).toBeNull();
  });
});

describe('detectGradingScale', () => {
  it('should detect Italian fraction limits via detectGradingScale', () => {
    expect(detectGradingScale('105/110')).toEqual({ upperLimit: '110', lowerLimit: '66' });
  });

  it.each(['', '   ', 'AB'])('should return null for invalid input %s', input => {
    expect(detectGradingScale(input)).toBeNull();
  });

  it('should return letter scale for single letter', () => {
    expect(detectGradingScale('b')).toEqual({ upperLimit: 'A', lowerLimit: 'E' });
  });

  it('should return numeric scale for numeric input', () => {
    const result = detectGradingScale('3.0');
    expect(result?.upperLimit).toBe('1.0');
    expect(result?.lowerLimit).toBe('4.0');
  });

  it('should return percentage scale for percentage input', () => {
    expect(detectGradingScale('80%')?.isPercentage).toBe(true);
  });
});

describe('shouldShowGradeWarning', () => {
  it.each([
    ['105/110', false],
    ['85/100', false],
    ['105//110', true],
    ['A/B', true],
    ['A', false],
    ['B+', false],
    ['2.5', false],
    ['85%', false],
    ['', false],
    ['   ', false],
    ['12345', true],
    ['A@', true],
    ['A++', true],
    ['+3', true],
    ['85%%', true],
    ['%85', true],
    ['1.2.3', true],
    ['.5', true],
    ['5.', true],
  ])('should return %s for %s', (input, expected) => {
    expect(shouldShowGradeWarning(input)).toBe(expected);
  });
});

describe('stripPercentage', () => {
  it.each([
    ['85%', '85'],
    [' 85% ', '85'],
    ['85', '85'],
    ['85%%', '85%'],
  ])('should map %s to %s', (input, expected) => {
    expect(stripPercentage(input)).toBe(expected);
  });
});

describe('addPercentage', () => {
  it.each([
    ['85', '85%'],
    ['85%', '85%'],
    ['', '%'],
  ])('should map %s to %s', (input, expected) => {
    expect(addPercentage(input)).toBe(expected);
  });
});

describe('getLetterValue', () => {
  it('should return 1 for plain A', () => {
    expect(getLetterValue('A')).toBe(1);
  });

  it('should treat modifiers and ordering correctly', () => {
    expect(getLetterValue('A+')).toBeLessThan(getLetterValue('A'));
    expect(getLetterValue('A-')).toBeGreaterThan(getLetterValue('A'));
    expect(getLetterValue('A*')).toBe(getLetterValue('A+'));
    expect(getLetterValue('B')).toBeGreaterThan(getLetterValue('A'));
  });

  it('should return 999 for an invalid input', () => {
    expect(getLetterValue('invalid')).toBe(999);
  });
});

describe('isNumericInRange', () => {
  it.each([
    ['2.5', '1.0', '4.0', true],
    ['1.0', '1.0', '4.0', true],
    ['4.0', '1.0', '4.0', true],
    ['5.0', '1.0', '4.0', false],
    ['2,5', '1.0', '4.0', true],
    ['75', '100', '50', true],
    ['30', '100', '50', false],
    ['75%', '100%', '50%', true],
    ['110%', '100%', '50%', false],
    ['abc', '1.0', '4.0', false],
    ['2.0', 'abc', '4.0', false],
    ['2.0', '1.0', 'abc', false],
  ])('should return %s for grade=%s upper=%s lower=%s', (grade, upper, lower, expected) => {
    expect(isNumericInRange(grade, upper, lower)).toBe(expected);
  });
});

describe('detectLetterGrade', () => {
  it('should return null for non-letter or multi-letter input', () => {
    expect(detectLetterGrade('3.5')).toBeNull();
    expect(detectLetterGrade('AB')).toBeNull();
  });

  it('should return A to E range for a plain letter between A and E', () => {
    expect(detectLetterGrade('B')).toEqual({ upperLimit: 'A', lowerLimit: 'E' });
  });

  it('should set upperLimit to A+ when letter has a modifier', () => {
    expect(detectLetterGrade('B+')?.upperLimit).toBe('A+');
  });

  it('should return A to itself for a letter outside A-E range', () => {
    expect(detectLetterGrade('Z')).toEqual({ upperLimit: 'A', lowerLimit: 'Z' });
  });
});

describe('detectNumericGrade', () => {
  it.each([
    ['', null],
    ['0.5', null],
    ['abc', null],
  ])('should return null for %s', (input, expected) => {
    expect(detectNumericGrade(input)).toBe(expected);
  });

  it.each([
    ['2.5', { upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false }],
    ['5.0', { upperLimit: '6.0', lowerLimit: '4.0', isPercentage: false }],
    ['21.0', { upperLimit: '40', lowerLimit: '20', isPercentage: false }],
    ['45.0', { upperLimit: '100', lowerLimit: '40', isPercentage: false }],
    ['60.0', { upperLimit: '100', lowerLimit: '50', isPercentage: false }],
    ['2,5', { upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false }],
  ])('should detect scale for %s', (input, expected) => {
    expect(detectNumericGrade(input)).toEqual(expected);
  });

  it('should return proportional range for values above 110', () => {
    const result = detectNumericGrade('200');
    expect(result?.upperLimit).toBe('200');
    expect(result?.lowerLimit).toBe('100');
  });

  it('should detect percentage grade correctly', () => {
    const result = detectNumericGrade('75%');
    expect(result).toEqual({ upperLimit: '100%', lowerLimit: '50%', isPercentage: true });
  });

  it('should return proportional percentage range for percentage values above 110', () => {
    expect(detectNumericGrade('200%')).toEqual({ upperLimit: '200%', lowerLimit: '100%', isPercentage: true });
  });
});

describe('normalizeLimitsForGrade', () => {
  const baseLimits: GradingScaleLimitsData = { upperLimit: '100', lowerLimit: '50' };

  it('should strip % from limits when grade is not a percentage', () => {
    const result = normalizeLimitsForGrade('3', { upperLimit: '100%', lowerLimit: '50%' });
    expect(result).toEqual({ upperLimit: '100', lowerLimit: '50', isPercentage: false });
  });

  it('should add % to limits when grade is a percentage', () => {
    const result = normalizeLimitsForGrade('75%', baseLimits);
    expect(result).toEqual({ upperLimit: '100%', lowerLimit: '50%', isPercentage: true });
  });

  it('should not double-add % if limits already have it', () => {
    const result = normalizeLimitsForGrade('75%', { upperLimit: '100%', lowerLimit: '50%' });
    expect(result.upperLimit).toBe('100%');
    expect(result.lowerLimit).toBe('50%');
  });

  it('should handle letter grades by stripping any stray %', () => {
    const result = normalizeLimitsForGrade('B', { upperLimit: 'A%', lowerLimit: 'E%' });
    expect(result).toEqual({ upperLimit: 'A', lowerLimit: 'E', isPercentage: false });
  });
});

describe('setControlError', () => {
  let control: FormControl;

  beforeEach(() => {
    control = new FormControl('');
  });

  it('should set the specified error on the control when hasError is true', () => {
    setControlError(control, 'customError', true);
    expect(control.errors).toEqual({ customError: true });
  });

  it('should preserve existing errors when adding a new one', () => {
    control.setErrors({ existingError: true });
    setControlError(control, 'customError', true);
    expect(control.errors).toEqual({ existingError: true, customError: true });
  });

  it('should remove the specified error when hasError is false', () => {
    control.setErrors({ customError: true, otherError: true });
    setControlError(control, 'customError', false);
    expect(control.errors).toEqual({ otherError: true });
  });

  it('should set errors to null when the last error is removed', () => {
    control.setErrors({ onlyError: true });
    setControlError(control, 'onlyError', false);
    expect(control.errors).toBeNull();
  });

  it('should not throw when removing a non-existent error from a clean control', () => {
    expect(() => setControlError(control, 'nonExistent', false)).not.toThrow();
    expect(control.errors).toBeNull();
  });
});
