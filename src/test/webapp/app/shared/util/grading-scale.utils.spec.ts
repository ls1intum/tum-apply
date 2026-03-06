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
  detectGradingScale,
  normalizeLimitsForGrade,
  shouldShowGradeWarning,
  setControlError,
  GradingScaleLimitsData,
} from 'app/shared/util/grading-scale.utils';

describe('getGradeType', () => {
  describe('invalid grades', () => {
    it('should return invalid for empty string', () => {
      expect(getGradeType('')).toBe('invalid');
    });

    it('should return invalid for whitespace-only string', () => {
      expect(getGradeType('   ')).toBe('invalid');
    });

    it('should return invalid for special character strings', () => {
      expect(getGradeType('!!')).toBe('invalid');
    });

    it('should return invalid for multi-letter strings without modifier', () => {
      expect(getGradeType('AB')).toBe('invalid');
    });

    it('should return invalid for letter string with multiple modifier', () => {
      expect(getGradeType('A++')).toBe('invalid');
    });

    it('should return invalid for percentage string with multiple modifier', () => {
      expect(getGradeType('85%%')).toBe('invalid');
    });

    it('should return invalid for numeric string with multiple modifier', () => {
      expect(getGradeType('85.5++')).toBe('invalid');
    });

    it('should return invalid for numeric string with more than 10 characters', () => {
      expect(getGradeType('85858585858')).toBe('invalid');
    });

    it('should return invalid for numeric string with no values after the dot', () => {
      expect(getGradeType('85.')).toBe('invalid');
    });
  });

  describe('letter grades', () => {
    it('should return letter for a plain uppercase letter', () => {
      expect(getGradeType('A')).toBe('letter');
    });

    it('should return letter for a lowercase letter', () => {
      expect(getGradeType('b')).toBe('letter');
    });

    it('should return letter for a letter with plus modifier', () => {
      expect(getGradeType('A+')).toBe('letter');
    });

    it('should return letter for a letter with minus modifier', () => {
      expect(getGradeType('B-')).toBe('letter');
    });

    it('should return letter for a letter with asterisk modifier', () => {
      expect(getGradeType('C*')).toBe('letter');
    });
  });

  describe('percentage grades', () => {
    it('should return percentage for an integer followed by %', () => {
      expect(getGradeType('85%')).toBe('percentage');
    });

    it('should return percentage for a decimal with dot followed by %', () => {
      expect(getGradeType('85.5%')).toBe('percentage');
    });

    it('should return percentage for a decimal with comma followed by %', () => {
      expect(getGradeType('85,5%')).toBe('percentage');
    });
  });

  describe('numeric grades', () => {
    it('should return numeric for an integer', () => {
      expect(getGradeType('3')).toBe('numeric');
    });

    it('should return numeric for a decimal with dot', () => {
      expect(getGradeType('1.7')).toBe('numeric');
    });

    it('should return numeric for a decimal with comma', () => {
      expect(getGradeType('2,3')).toBe('numeric');
    });

    it('should return numeric for a integer up to 10 characters', () => {
      expect(getGradeType('1000000000')).toBe('numeric');
    });
  });
});

describe('stripPercentage', () => {
  it('should remove % sign from percentage string', () => {
    expect(stripPercentage('85%')).toBe('85');
  });

  it('should trim surrounding whitespace', () => {
    expect(stripPercentage(' 85% ')).toBe('85');
  });

  it('should return the original string when no % is present', () => {
    expect(stripPercentage('85')).toBe('85');
  });

  it('should only remove the first % occurrence', () => {
    expect(stripPercentage('85%%')).toBe('85%');
  });
});

describe('addPercentage', () => {
  it('should append % to a plain number string', () => {
    expect(addPercentage('85')).toBe('85%');
  });

  it('should not duplicate % when already present', () => {
    expect(addPercentage('85%')).toBe('85%');
  });

  it('should append % to an empty string', () => {
    expect(addPercentage('')).toBe('%');
  });
});

describe('getLetterValue', () => {
  it('should return 1 for plain A', () => {
    expect(getLetterValue('A')).toBe(1);
  });

  it('should return a lower value for A+ than plain A', () => {
    expect(getLetterValue('A+')).toBeLessThan(getLetterValue('A'));
  });

  it('should return a higher value for A- than plain A', () => {
    expect(getLetterValue('A-')).toBeGreaterThan(getLetterValue('A'));
  });

  it('should treat * modifier same as +', () => {
    expect(getLetterValue('A*')).toBe(getLetterValue('A+'));
  });

  it('should return a higher value for B than A', () => {
    expect(getLetterValue('B')).toBeGreaterThan(getLetterValue('A'));
  });

  it('should return 999 for an invalid input', () => {
    expect(getLetterValue('invalid')).toBe(999);
  });
});

describe('isNumericInRange', () => {
  describe('when upper < lower (ascending scale like German grades)', () => {
    it('should return true when grade is within the range', () => {
      expect(isNumericInRange('2.5', '1.0', '4.0')).toBe(true);
    });

    it('should return true for grade at upper boundary', () => {
      expect(isNumericInRange('1.0', '1.0', '4.0')).toBe(true);
    });

    it('should return true for grade at lower boundary', () => {
      expect(isNumericInRange('4.0', '1.0', '4.0')).toBe(true);
    });

    it('should return false when grade is outside the range', () => {
      expect(isNumericInRange('5.0', '1.0', '4.0')).toBe(false);
    });

    it('should handle comma as decimal separator', () => {
      expect(isNumericInRange('2,5', '1.0', '4.0')).toBe(true);
    });
  });

  describe('when lower < upper (percentage / point scales)', () => {
    it('should return true when grade is within the range', () => {
      expect(isNumericInRange('75', '100', '50')).toBe(true);
    });

    it('should return false when grade is below the lower bound', () => {
      expect(isNumericInRange('30', '100', '50')).toBe(false);
    });
  });

  describe('percentage grades', () => {
    it('should handle percentage grades correctly with grade between limits', () => {
      expect(isNumericInRange('75%', '100%', '50%')).toBe(true);
    });

    it('should handle percentage grades correctly with grade outside of limits', () => {
      expect(isNumericInRange('110%', '100%', '50%')).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('should return false when grade is NaN', () => {
      expect(isNumericInRange('abc', '1.0', '4.0')).toBe(false);
    });

    it('should return false when upper is NaN', () => {
      expect(isNumericInRange('2.0', 'abc', '4.0')).toBe(false);
    });

    it('should return false when lower is NaN', () => {
      expect(isNumericInRange('2.0', '1.0', 'abc')).toBe(false);
    });
  });
});

describe('detectLetterGrade', () => {
  it('should return null for a non-letter input', () => {
    expect(detectLetterGrade('3.5')).toBeNull();
  });

  it('should return A to E range for a plain letter between A and E', () => {
    const result = detectLetterGrade('B');
    expect(result).toEqual({ upperLimit: 'A', lowerLimit: 'E' });
  });

  it('should set upperLimit to A+ when letter has a modifier', () => {
    const result = detectLetterGrade('B+');
    expect(result?.upperLimit).toBe('A+');
  });

  it('should return A to itself for a letter outside A–E range', () => {
    const result = detectLetterGrade('Z');
    expect(result).toEqual({ upperLimit: 'A', lowerLimit: 'Z' });
  });

  it('should return null for multi-letter strings', () => {
    expect(detectLetterGrade('AB')).toBeNull();
  });
});

describe('detectNumericGrade', () => {
  it('should return null for empty string', () => {
    expect(detectNumericGrade('')).toBeNull();
  });

  it('should return null for values below 1', () => {
    expect(detectNumericGrade('0.5')).toBeNull();
  });

  it('should return null for non-numeric strings', () => {
    expect(detectNumericGrade('abc')).toBeNull();
  });

  it('should detect German-scale grade (1.0 - 4.0) correctly', () => {
    const result = detectNumericGrade('2.5');
    expect(result).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
  });

  it('should detect Swiss-scale (4.0 - 6.0) correctly', () => {
    const result = detectNumericGrade('5.0');
    expect(result).toEqual({ upperLimit: '6.0', lowerLimit: '4.0', isPercentage: false });
  });

  it('should detect Spanish-scale (10 - 5) correctly', () => {
    const result = detectNumericGrade('7.0');
    expect(result).toEqual({ upperLimit: '10', lowerLimit: '5', isPercentage: false });
  });

  it('should detect French-scale (20 - 10) correctly', () => {
    const result = detectNumericGrade('11.0');
    expect(result).toEqual({ upperLimit: '20', lowerLimit: '10', isPercentage: false });
  });

  it('should detect unknown scale range 40 to 20 correctly', () => {
    const result = detectNumericGrade('21.0');
    expect(result).toEqual({ upperLimit: '40', lowerLimit: '20', isPercentage: false });
  });

  it('should detect first-percentage-scale (100 - 40) correctly', () => {
    const result = detectNumericGrade('45.0');
    expect(result).toEqual({ upperLimit: '100', lowerLimit: '40', isPercentage: false });
  });

  it('should detect second-percentage-scale (100 - 50) correctly', () => {
    const result = detectNumericGrade('60.0');
    expect(result).toEqual({ upperLimit: '100', lowerLimit: '50', isPercentage: false });
  });

  it('should return proportional range for values above 110', () => {
    const result = detectNumericGrade('200');
    expect(result?.upperLimit).toBe('200');
    expect(result?.lowerLimit).toBe('100');
  });

  it('should detect percentage grade correctly', () => {
    const result = detectNumericGrade('75%');
    expect(result?.isPercentage).toBe(true);
    expect(result?.upperLimit).toBe('100%');
    expect(result?.lowerLimit).toBe('50%');
  });

  it('should return proportional percentage range for percentage values above 110', () => {
    const result = detectNumericGrade('200%');
    expect(result?.upperLimit).toBe('200%');
    expect(result?.lowerLimit).toBe('100%');
    expect(result?.isPercentage).toBe(true);
  });

  it('should handle comma as decimal separator', () => {
    const result = detectNumericGrade('2,5');
    expect(result).toEqual({ upperLimit: '1.0', lowerLimit: '4.0', isPercentage: false });
  });
});

describe('detectGradingScale', () => {
  it('should return null for empty string', () => {
    expect(detectGradingScale('')).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    expect(detectGradingScale('   ')).toBeNull();
  });

  it('should return null for multi-letter string without modifier', () => {
    expect(detectGradingScale('AB')).toBeNull();
  });

  it('should return letter grade scale for single letter', () => {
    const result = detectGradingScale('b');
    expect(result).toEqual({ upperLimit: 'A', lowerLimit: 'E' });
  });

  it('should return numeric scale for numeric input', () => {
    const result = detectGradingScale('3.0');
    expect(result?.upperLimit).toBe('1.0');
    expect(result?.lowerLimit).toBe('4.0');
  });

  it('should return percentage scale for percentage input', () => {
    const result = detectGradingScale('80%');
    expect(result?.isPercentage).toBe(true);
  });
});

describe('normalizeLimitsForGrade', () => {
  const baseLimits: GradingScaleLimitsData = { upperLimit: '100', lowerLimit: '50' };

  it('should strip % from limits when grade is not a percentage', () => {
    const limits: GradingScaleLimitsData = { upperLimit: '100%', lowerLimit: '50%' };
    const result = normalizeLimitsForGrade('3', limits);
    expect(result.upperLimit).toBe('100');
    expect(result.lowerLimit).toBe('50');
    expect(result.isPercentage).toBe(false);
  });

  it('should add % to limits when grade is a percentage', () => {
    const result = normalizeLimitsForGrade('75%', baseLimits);
    expect(result.upperLimit).toBe('100%');
    expect(result.lowerLimit).toBe('50%');
    expect(result.isPercentage).toBe(true);
  });

  it('should not double-add % if limits already have it and grade is percentage', () => {
    const limitsWithPercent: GradingScaleLimitsData = { upperLimit: '100%', lowerLimit: '50%' };
    const result = normalizeLimitsForGrade('75%', limitsWithPercent);
    expect(result.upperLimit).toBe('100%');
    expect(result.lowerLimit).toBe('50%');
  });

  it('should handle letter grades by stripping any stray %', () => {
    const limitsWithPercent: GradingScaleLimitsData = { upperLimit: 'A%', lowerLimit: 'E%' };
    const result = normalizeLimitsForGrade('B', limitsWithPercent);
    expect(result.upperLimit).toBe('A');
    expect(result.lowerLimit).toBe('E');
    expect(result.isPercentage).toBe(false);
  });
});

describe('shouldShowGradeWarning', () => {
  describe('valid grades — no warning expected', () => {
    it('should return false for a plain letter grade', () => {
      expect(shouldShowGradeWarning('A')).toBe(false);
    });

    it('should return false for a letter + modifier', () => {
      expect(shouldShowGradeWarning('B+')).toBe(false);
    });

    it('should return false for a numeric grade with dot', () => {
      expect(shouldShowGradeWarning('2.5')).toBe(false);
    });

    it('should return false for a valid percentage grade', () => {
      expect(shouldShowGradeWarning('85%')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(shouldShowGradeWarning('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(shouldShowGradeWarning('   ')).toBe(false);
    });
  });

  describe('invalid grades — warning expected', () => {
    it('should return true for a number longer than 4 digits', () => {
      expect(shouldShowGradeWarning('12345')).toBe(true);
    });

    it('should return true for special characters other than allowed ones', () => {
      expect(shouldShowGradeWarning('A@')).toBe(true);
    });

    it('should return true for multiple modifier characters', () => {
      expect(shouldShowGradeWarning('A++')).toBe(true);
    });

    it('should return true for modifier not following a letter', () => {
      expect(shouldShowGradeWarning('+3')).toBe(true);
    });

    it('should return true for multiple % signs', () => {
      expect(shouldShowGradeWarning('85%%')).toBe(true);
    });

    it('should return true for % not following a number', () => {
      expect(shouldShowGradeWarning('%85')).toBe(true);
    });

    it('should return true for multiple decimal separators', () => {
      expect(shouldShowGradeWarning('1.2.3')).toBe(true);
    });

    it('should return true for leading decimal separator', () => {
      expect(shouldShowGradeWarning('.5')).toBe(true);
    });

    it('should return true for trailing decimal separator', () => {
      expect(shouldShowGradeWarning('5.')).toBe(true);
    });
  });
});

describe('setControlError', () => {
  let control: FormControl;

  beforeEach(() => {
    control = new FormControl('');
  });

  describe('adding errors', () => {
    it('should set the specified error on the control when hasError is true', () => {
      setControlError(control, 'customError', true);
      expect(control.errors).toEqual({ customError: true });
    });

    it('should preserve existing errors when adding a new one', () => {
      control.setErrors({ existingError: true });
      setControlError(control, 'customError', true);
      expect(control.errors).toEqual({ existingError: true, customError: true });
    });
  });

  describe('removing errors', () => {
    it('should remove the specified error when hasError is false', () => {
      control.setErrors({ customError: true });
      setControlError(control, 'customError', false);
      expect(control.errors).toBeNull();
    });

    it('should only remove the specified error and keep others intact', () => {
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
});
