import {
  isNumeric,
  isLetter,
  isPercentage,
  cleanLetter,
  parseNumeric,
  hasTooManyDecimals,
  toggleError,
  validateFormat,
  validateSameFormat,
  validateBoundaryMismatch,
  validateGradeRange,
  gradeFormatValidator,
} from '../../../../../../src/main/webapp/app/core/util/grade-format.validator';
import { FormControl, FormGroup } from '@angular/forms';

describe('grade-format.validator', () => {
  it('should detect numeric, letter, percentage', () => {
    expect(isNumeric('1.5')).toBe(true);
    expect(isNumeric('1,5')).toBe(true);
    expect(isLetter('A+')).toBe(true);
    expect(isPercentage('85%')).toBe(true);
    expect(isPercentage('85,5%')).toBe(true);
  });

  it('should clean letter', () => {
    expect(cleanLetter('a+')).toBe('A');
    expect(cleanLetter('B*')).toBe('B');
  });

  it('should parse numeric and percentage', () => {
    expect(parseNumeric('1,5')).toBeCloseTo(1.5);
    expect(parseNumeric('85%')).toBe(85);
  });

  it('should detect too many decimals', () => {
    expect(hasTooManyDecimals('1.123')).toBe(true);
    expect(hasTooManyDecimals('1.12')).toBe(false);
  });

  it('should validate format', () => {
    const c1 = new FormControl('1.5');
    const c2 = new FormControl('2.0');
    const c3 = new FormControl('3.0');
    expect(validateFormat([c1, c2, c3], [isNumeric, isLetter, isPercentage])).toBeNull();
    c1.setValue('1.123');
    expect(validateFormat([c1], [isNumeric])).toBe('tooManyDecimals');
  });

  it('should validate same format', () => {
    expect(validateSameFormat(['1.0', '2.0'])).toBe('numeric');
    expect(validateSameFormat(['A', 'B'])).toBe('letter');
    expect(validateSameFormat(['80%', '90%'])).toBe('percentage');
    expect(validateSameFormat(['1.0', 'A'])).toBeNull();
  });

  it('should validate boundary mismatch', () => {
    expect(validateBoundaryMismatch('percentage', '100%', '50%')).toBe(false);
    expect(validateBoundaryMismatch('letter', 'A', 'B')).toBe(false);
    expect(validateBoundaryMismatch('letter', 'B', 'A')).toBe(true);
  });

  it('should validate grade range', () => {
    expect(validateGradeRange('numeric', '1.0', '4.0', '2.0')).toBe(false);
    expect(validateGradeRange('numeric', '1.0', '4.0', '5.0')).toBe(true);
    expect(validateGradeRange('percentage', '100%', '50%', '75%')).toBe(false);
    expect(validateGradeRange('percentage', '100%', '50%', '40%')).toBe(true);
    expect(validateGradeRange('letter', 'A', 'C', 'B')).toBe(false);
    expect(validateGradeRange('letter', 'A', 'C', 'Z')).toBe(true);
  });

  it('should validate gradeFormatValidator for valid and invalid cases', () => {
    const group = new FormGroup({
      upper: new FormControl('1.0'),
      lower: new FormControl('4.0'),
      grade: new FormControl('2.0'),
    });
    const validator = gradeFormatValidator('upper', 'lower', 'grade');
    expect(validator(group)).toBeNull();
    group.get('grade')!.setValue('5.0');
    expect(validator(group)).toEqual({ outOfRange: true });
    group.get('grade')!.setValue('2.0');
    group.get('upper')!.setValue('A');
    group.get('lower')!.setValue('C');
    group.get('grade')!.setValue('B');
    expect(validator(group)).toBeNull();
    group.get('grade')!.setValue('Z');
    expect(validator(group)).toEqual({ outOfRange: true });
    group.get('upper')!.setValue('B');
    group.get('lower')!.setValue('A');
    group.get('grade')!.setValue('A');
    expect(validator(group)).toEqual({ boundaryMismatch: true });
  });
});
