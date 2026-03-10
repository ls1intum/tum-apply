import { FormControl, FormGroup } from '@angular/forms';
import { gradingScaleRangeValidator, gradingScaleTypeValidator } from 'app/shared/validators/grading-scale-validators';
import { describe, it, expect } from 'vitest';

function createControl(value: string | null): FormControl {
  return new FormControl(value);
}

function createRangeGroup(upperValue: string, lowerValue: string): FormGroup {
  return new FormGroup({
    upperLimit: new FormControl(upperValue),
    lowerLimit: new FormControl(lowerValue),
  });
}

describe('gradingScaleTypeValidator', () => {
  it.each([
    ['', '3.5'],
    [null, '3.5'],
    ['3.5', ''],
    ['', ''],
  ])('should return null when grade="%s" or limit="%s" is empty', (grade, limit) => {
    const validator = gradingScaleTypeValidator(() => limit ?? '');
    expect(validator(createControl(grade))).toBeNull();
  });

  it.each([
    ['3.5', '1.0', null, 'numeric grade + numeric limit'],
    ['3.5', 'A', { invalidLimitType: true }, 'numeric grade + letter limit'],
    ['3.5', '85%', { invalidLimitType: true }, 'numeric grade + percentage limit'],
    ['85%', '90%', null, 'percentage grade + percentage limit'],
    ['85%', '90', null, 'percentage grade + numeric limit'],
    ['85%', 'A', null, 'percentage grade + letter limit'],
    ['B+', 'A', null, 'letter grade + letter limit'],
    ['B+', '3.5', { invalidLimitType: true }, 'letter grade + numeric limit'],
    ['B+', '85%', { invalidLimitType: true }, 'letter grade + percentage limit'],
    ['  3.5  ', '  A  ', { invalidLimitType: true }, 'trims whitespace before type check'],
  ] as const)('should return correct result for %s (%s)', (grade, limit, expected, _description) => {
    const validator = gradingScaleTypeValidator(() => grade);
    expect(validator(createControl(limit))).toEqual(expected);
  });
});

describe('gradingScaleRangeValidator', () => {
  describe('when controls are missing from group', () => {
    it('should return null when upperLimit control is missing', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = new FormGroup({ lowerLimit: new FormControl('1.0') });

      expect(validator(group)).toBeNull();
    });

    it('should return null when lowerLimit control is missing', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = new FormGroup({ upperLimit: new FormControl('4.0') });

      expect(validator(group)).toBeNull();
    });

    it('should return outOfRange error when limits are given but grade is invalid', () => {
      const validator = gradingScaleRangeValidator(() => '$');
      const group = new FormGroup({ upperLimit: new FormControl('1.0'), lowerLimit: new FormControl('4.0') });

      expect(validator(group)).toEqual({ outOfRange: true });
    });
  });

  describe('when controls have invalidLimitType errors', () => {
    it('should return null and clear outOfRange errors when upperLimit has invalidLimitType', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = createRangeGroup('A', '1.0');
      group.get('upperLimit')!.setErrors({ invalidLimitType: true });

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });

    it('should return null and clear outOfRange errors when lowerLimit has invalidLimitType', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = createRangeGroup('4.0', 'A');
      group.get('lowerLimit')!.setErrors({ invalidLimitType: true });

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });
  });

  describe('when values are empty', () => {
    it.each([
      ['', '1.0', '3.5', 'upperLimit is empty'],
      ['4.0', '', '3.5', 'lowerLimit is empty'],
      ['4.0', '1.0', '', 'getCurrentGrade returns empty'],
    ])('should return null and clear outOfRange errors when %s', (upper, lower, grade) => {
      const validator = gradingScaleRangeValidator(() => grade);
      const group = createRangeGroup(upper, lower);

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });
  });

  describe('return value for numeric and percentage grades', () => {
    it.each([
      ['3.5', '4.0', '1.0', null, 'numeric grade in range'],
      ['4.0', '4.0', '1.0', null, 'numeric grade equals upper limit'],
      ['1.0', '4.0', '1.0', null, 'numeric grade equals lower limit'],
      ['5.0', '4.0', '1.0', { outOfRange: true }, 'numeric grade above upper limit'],
      ['0.5', '4.0', '1.0', { outOfRange: true }, 'numeric grade below lower limit'],
      ['85%', '100%', '50%', null, 'percentage grade in range'],
      ['30%', '100%', '50%', { outOfRange: true }, 'percentage grade below range'],
      ['  5.0  ', '  4.0  ', '  1.0  ', { outOfRange: true }, 'trims whitespace before range check'],
    ] as const)('should return %j for %s', (grade, upper, lower, expected, _description) => {
      const validator = gradingScaleRangeValidator(() => grade);
      expect(validator(createRangeGroup(upper, lower))).toEqual(expected);
    });
  });

  describe('outOfRange errors on controls for numeric and percentage grades', () => {
    it.each([
      ['5.0', '4.0', '1.0', true, 'sets errors when grade is above range'],
      ['0.5', '4.0', '1.0', true, 'sets errors when grade is below range'],
      ['3.5', '4.0', '1.0', false, 'clears errors when grade is in range'],
      ['30%', '100%', '50%', true, 'sets errors when percentage grade is below range'],
      ['85%', '100%', '50%', false, 'clears errors when percentage grade is in range'],
    ] as const)('%s: hasError outOfRange = %s', (grade, upper, lower, hasError, _description) => {
      const validator = gradingScaleRangeValidator(() => grade);
      const group = createRangeGroup(upper, lower);

      validator(group);

      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(hasError);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(hasError);
    });

    it('should clear previously set outOfRange errors when grade comes back in range', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = createRangeGroup('4.0', '1.0');
      group.get('upperLimit')!.setErrors({ outOfRange: true });
      group.get('lowerLimit')!.setErrors({ outOfRange: true });

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });
  });

  describe('letter grades', () => {
    it('should always return null for letter grades regardless of limit values', () => {
      const validator = gradingScaleRangeValidator(() => 'B+');
      expect(validator(createRangeGroup('A', 'F'))).toBeNull();
    });

    it('should clear outOfRange errors on both controls for letter grades', () => {
      const validator = gradingScaleRangeValidator(() => 'Z');
      const group = createRangeGroup('A', 'F');
      group.get('upperLimit')!.setErrors({ outOfRange: true });
      group.get('lowerLimit')!.setErrors({ outOfRange: true });

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });
  });
});
