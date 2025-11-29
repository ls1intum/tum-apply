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
} from 'app/core/util/grade-format.validator';
import { FormControl, FormGroup } from '@angular/forms';

describe('grade-format.validator', () => {
  describe('format detection', () => {
    it.each([
      ['numeric', '1.5', isNumeric],
      ['letter', 'A+', isLetter],
      ['percentage', '85%', isPercentage],
    ])('should detect %s format', (_label, input, detector) => {
      expect(detector(input)).toBe(true);
    });
  });

  describe('cleanLetter', () => {
    it('should clean letter grades', () => {
      expect(cleanLetter('a+')).toBe('A');
    });
  });

  describe('parseNumeric', () => {
    it('should parse comma decimal', () => {
      expect(parseNumeric('1,5')).toBeCloseTo(1.5);
    });
  });

  describe('hasTooManyDecimals', () => {
    it.each([
      ['too many', '1.123', true],
      ['acceptable', '1.12', false],
    ])('should detect %s decimals', (_label, input, expected) => {
      expect(hasTooManyDecimals(input)).toBe(expected);
    });
  });

  describe('validateFormat', () => {
    it('should validate correct formats', () => {
      const c1 = new FormControl('1.5');
      expect(validateFormat([c1], [isNumeric])).toBeNull();
    });

    it('should detect too many decimals', () => {
      const c1 = new FormControl('1.123');
      expect(validateFormat([c1], [isNumeric])).toBe('tooManyDecimals');
    });
  });

  describe('validateSameFormat', () => {
    it.each([
      ['numeric', ['1.0', '2.0'], 'numeric'],
      ['letter', ['A', 'B'], 'letter'],
      ['mixed', ['1.0', 'A'], null],
    ])('should detect %s formats', (_label, inputs, expected) => {
      expect(validateSameFormat(inputs)).toBe(expected);
    });
  });

  describe('validateBoundaryMismatch', () => {
    it.each([
      ['correct order', 'letter', 'A', 'B', false],
      ['reversed order', 'letter', 'B', 'A', true],
    ])('should validate %s', (_label, format, best, worst, expected) => {
      expect(validateBoundaryMismatch(format, best, worst)).toBe(expected);
    });
  });

  describe('validateGradeRange', () => {
    it.each([
      ['numeric in range', 'numeric', '1.0', '4.0', '2.0', false],
      ['numeric out of range', 'numeric', '1.0', '4.0', '5.0', true],
      ['letter in range', 'letter', 'A', 'C', 'B', false],
      ['letter out of range', 'letter', 'A', 'C', 'Z', true],
    ])('should validate %s', (_label, format, best, worst, achieved, expected) => {
      expect(validateGradeRange(format, best, worst, achieved)).toBe(expected);
    });
  });

  describe('gradeFormatValidator', () => {
    let group: FormGroup;
    let validator: ReturnType<typeof gradeFormatValidator>;

    beforeEach(() => {
      group = new FormGroup({
        upper: new FormControl('1.0'),
        lower: new FormControl('4.0'),
        grade: new FormControl('2.0'),
      });
      validator = gradeFormatValidator('upper', 'lower', 'grade');
    });

    it('should validate grades in range', () => {
      expect(validator(group)).toBeNull();
    });

    it('should detect grade out of range', () => {
      group.get('grade')!.setValue('5.0');
      expect(validator(group)).toEqual({ outOfRange: true });
    });

    it('should detect boundary mismatch', () => {
      group.get('upper')!.setValue('B');
      group.get('lower')!.setValue('A');
      expect(validator(group)).toEqual({ formatMismatch: true });
    });
  });
});
