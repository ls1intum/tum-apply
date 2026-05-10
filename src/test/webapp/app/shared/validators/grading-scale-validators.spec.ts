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

function getControl(group: FormGroup, name: string): FormControl {
  return group.get(name) as FormControl;
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
  it.each([
    ['lowerLimit', '1.0'],
    ['upperLimit', '4.0'],
  ])('should return null when only %s is in the group', (controlName, controlValue) => {
    const validator = gradingScaleRangeValidator(() => '3.5');
    const group = new FormGroup({ [controlName]: new FormControl(controlValue) });
    expect(validator(group)).toBeNull();
  });

  it('should return outOfRange error when limits are given but grade is invalid', () => {
    const validator = gradingScaleRangeValidator(() => '$');
    const group = new FormGroup({ upperLimit: new FormControl('1.0'), lowerLimit: new FormControl('4.0') });
    expect(validator(group)).toEqual({ outOfRange: true });
  });

  it.each([
    ['upperLimit invalidLimitType', 'A', '1.0', '3.5'],
    ['lowerLimit invalidLimitType', '4.0', 'A', '3.5'],
    ['upperLimit empty', '', '1.0', '3.5'],
    ['lowerLimit empty', '4.0', '', '3.5'],
    ['grade empty', '4.0', '1.0', ''],
  ])('should return null and clear outOfRange when %s', (label, upper, lower, grade) => {
    const validator = gradingScaleRangeValidator(() => grade);
    const group = createRangeGroup(upper, lower);
    if (label.includes('invalidLimitType')) {
      const target = label.startsWith('upper') ? 'upperLimit' : 'lowerLimit';
      getControl(group, target).setErrors({ invalidLimitType: true });
    }

    expect(validator(group)).toBeNull();
    expect(getControl(group, 'upperLimit').hasError('outOfRange')).toBe(false);
    expect(getControl(group, 'lowerLimit').hasError('outOfRange')).toBe(false);
  });

  it.each([
    ['3.5', '4.0', '1.0', null, false],
    ['4.0', '4.0', '1.0', null, false],
    ['1.0', '4.0', '1.0', null, false],
    ['5.0', '4.0', '1.0', { outOfRange: true }, true],
    ['0.5', '4.0', '1.0', { outOfRange: true }, true],
    ['85%', '100%', '50%', null, false],
    ['30%', '100%', '50%', { outOfRange: true }, true],
    ['  5.0  ', '  4.0  ', '  1.0  ', { outOfRange: true }, true],
  ] as const)('should return %j for grade=%s with upper=%s lower=%s', (grade, upper, lower, expected, hasError) => {
    const validator = gradingScaleRangeValidator(() => grade);
    const group = createRangeGroup(upper, lower);

    expect(validator(group)).toEqual(expected);
    expect(getControl(group, 'upperLimit').hasError('outOfRange')).toBe(hasError);
    expect(getControl(group, 'lowerLimit').hasError('outOfRange')).toBe(hasError);
  });

  it('should clear previously set outOfRange errors when grade comes back in range', () => {
    const validator = gradingScaleRangeValidator(() => '3.5');
    const group = createRangeGroup('4.0', '1.0');
    getControl(group, 'upperLimit').setErrors({ outOfRange: true });
    getControl(group, 'lowerLimit').setErrors({ outOfRange: true });

    expect(validator(group)).toBeNull();
    expect(getControl(group, 'upperLimit').hasError('outOfRange')).toBe(false);
    expect(getControl(group, 'lowerLimit').hasError('outOfRange')).toBe(false);
  });

  it('should always return null and clear outOfRange errors for letter grades', () => {
    const validator = gradingScaleRangeValidator(() => 'Z');
    const group = createRangeGroup('A', 'F');
    getControl(group, 'upperLimit').setErrors({ outOfRange: true });
    getControl(group, 'lowerLimit').setErrors({ outOfRange: true });

    expect(validator(group)).toBeNull();
    expect(getControl(group, 'upperLimit').hasError('outOfRange')).toBe(false);
    expect(getControl(group, 'lowerLimit').hasError('outOfRange')).toBe(false);
  });
});
