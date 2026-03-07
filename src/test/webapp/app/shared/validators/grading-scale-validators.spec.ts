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
  describe('when limit or grade is empty', () => {
    it('should return null when control value is empty string', () => {
      const validator = gradingScaleTypeValidator(() => '3.5');
      const result = validator(createControl(''));

      expect(result).toBeNull();
    });

    it('should return null when control value is null', () => {
      const validator = gradingScaleTypeValidator(() => '3.5');
      const result = validator(createControl(null));

      expect(result).toBeNull();
    });

    it('should return null when getCurrentGrade returns empty string', () => {
      const validator = gradingScaleTypeValidator(() => '');
      const result = validator(createControl('3.5'));

      expect(result).toBeNull();
    });

    it('should return null when both grade and limit are empty', () => {
      const validator = gradingScaleTypeValidator(() => '');
      const result = validator(createControl(''));

      expect(result).toBeNull();
    });
  });

  describe('numeric grade type', () => {
    it('should return null when both grade and limit are numeric', () => {
      const validator = gradingScaleTypeValidator(() => '3.5');
      const result = validator(createControl('1.0'));

      expect(result).toBeNull();
    });

    it('should return null when both grade and limit are integers', () => {
      const validator = gradingScaleTypeValidator(() => '3');
      const result = validator(createControl('1'));

      expect(result).toBeNull();
    });

    it('should return invalidLimitType error when grade is numeric but limit is a letter grade', () => {
      const validator = gradingScaleTypeValidator(() => '3.5');
      const result = validator(createControl('A'));

      expect(result).toEqual({ invalidLimitType: true });
    });

    it('should return invalidLimitType error when grade is numeric but limit is a percentage', () => {
      const validator = gradingScaleTypeValidator(() => '3.5');
      const result = validator(createControl('85%'));

      expect(result).toEqual({ invalidLimitType: true });
    });
  });

  describe('percentage grade type', () => {
    it('should return null when grade is percentage and limit is also percentage', () => {
      const validator = gradingScaleTypeValidator(() => '85%');
      const result = validator(createControl('90%'));

      expect(result).toBeNull();
    });

    it('should return null when grade is percentage and limit is numeric', () => {
      const validator = gradingScaleTypeValidator(() => '85%');
      const result = validator(createControl('90'));

      expect(result).toBeNull();
    });

    it('should return null when grade is percentage but limit is letter', () => {
      const validator = gradingScaleTypeValidator(() => '85%');
      const result = validator(createControl('A'));

      expect(result).toEqual(null);
    });
  });

  describe('letter grade type', () => {
    it('should return null when both grade and limit are letter grades', () => {
      const validator = gradingScaleTypeValidator(() => 'B+');
      const result = validator(createControl('A'));

      expect(result).toBeNull();
    });

    it('should return null for single letter grades', () => {
      const validator = gradingScaleTypeValidator(() => 'B');
      const result = validator(createControl('A'));

      expect(result).toBeNull();
    });

    it('should return invalidLimitType error when grade is letter but limit is numeric', () => {
      const validator = gradingScaleTypeValidator(() => 'B+');
      const result = validator(createControl('3.5'));

      expect(result).toEqual({ invalidLimitType: true });
    });

    it('should return invalidLimitType error when grade is letter but limit is percentage', () => {
      const validator = gradingScaleTypeValidator(() => 'B+');
      const result = validator(createControl('85%'));

      expect(result).toEqual({ invalidLimitType: true });
    });
  });

  describe('whitespace trimming', () => {
    it('should trim whitespace from control value and grade before comparing types', () => {
      const validator = gradingScaleTypeValidator(() => '  3.5  ');
      const result = validator(createControl('  1.0  '));

      expect(result).toBeNull();
    });

    it('should trim whitespace and still detect type mismatch', () => {
      const validator = gradingScaleTypeValidator(() => '  3.5  ');
      const result = validator(createControl('  A  '));

      expect(result).toEqual({ invalidLimitType: true });
    });
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

    it('should return null when both controls are missing', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = new FormGroup({});

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
    it('should return null and clear outOfRange errors when upperLimit is empty', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = createRangeGroup('', '1.0');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });

    it('should return null and clear outOfRange errors when lowerLimit is empty', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = createRangeGroup('4.0', '');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });

    it('should return null and clear outOfRange errors when getCurrentGrade returns empty', () => {
      const validator = gradingScaleRangeValidator(() => '');
      const group = createRangeGroup('4.0', '1.0');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });
  });

  describe('numeric grades', () => {
    it('should return null and clear errors when numeric grade is within range', () => {
      const validator = gradingScaleRangeValidator(() => '3.5');
      const group = createRangeGroup('4.0', '1.0');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });

    it('should return null when numeric grade equals upper limit', () => {
      const validator = gradingScaleRangeValidator(() => '4.0');
      const group = createRangeGroup('4.0', '1.0');

      expect(validator(group)).toBeNull();
    });

    it('should return null when numeric grade equals lower limit', () => {
      const validator = gradingScaleRangeValidator(() => '1.0');
      const group = createRangeGroup('4.0', '1.0');

      expect(validator(group)).toBeNull();
    });

    it('should return outOfRange error and set errors on both controls when grade is above upper limit', () => {
      const validator = gradingScaleRangeValidator(() => '5.0');
      const group = createRangeGroup('4.0', '1.0');

      const result = validator(group);

      expect(result).toEqual({ outOfRange: true });
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(true);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(true);
    });

    it('should return outOfRange error when grade is below lower limit', () => {
      const validator = gradingScaleRangeValidator(() => '0.5');
      const group = createRangeGroup('4.0', '1.0');

      const result = validator(group);

      expect(result).toEqual({ outOfRange: true });
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(true);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(true);
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

  describe('percentage grades', () => {
    it('should return null when percentage grade is within range', () => {
      const validator = gradingScaleRangeValidator(() => '85%');
      const group = createRangeGroup('100%', '50%');

      const result = validator(group);

      expect(result).toBeNull();
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(false);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(false);
    });

    it('should return outOfRange error and set errors on both controls when percentage grade is below range', () => {
      const validator = gradingScaleRangeValidator(() => '30%');
      const group = createRangeGroup('100%', '50%');

      const result = validator(group);

      expect(result).toEqual({ outOfRange: true });
      expect(group.get('upperLimit')!.hasError('outOfRange')).toBe(true);
      expect(group.get('lowerLimit')!.hasError('outOfRange')).toBe(true);
    });
  });

  describe('letter grades', () => {
    it('should always return null for letter grades regardless of limit values', () => {
      const validator = gradingScaleRangeValidator(() => 'B+');
      const group = createRangeGroup('A', 'F');

      expect(validator(group)).toBeNull();
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

  describe('whitespace trimming', () => {
    it('should trim whitespace and correctly validate numeric grade in range', () => {
      const validator = gradingScaleRangeValidator(() => '  3.5  ');
      const group = createRangeGroup('  4.0  ', '  1.0  ');

      expect(validator(group)).toBeNull();
    });

    it('should trim whitespace and correctly detect out of range', () => {
      const validator = gradingScaleRangeValidator(() => '  5.0  ');
      const group = createRangeGroup('  4.0  ', '  1.0  ');

      expect(validator(group)).toEqual({ outOfRange: true });
    });
  });
});
