import { describe, it, expect } from 'vitest';
import { convertToGermanGrade, formatGrade, convertAndFormatGermanGrade, displayGradeWithConversion } from 'app/core/util/grade-conversion';

describe('grade-conversion', () => {
  describe('convertToGermanGrade', () => {
    it.each([
      ['numeric grades', '1.0', '4.0', '2.0', 2.0, 0],
      ['percentage grades', '100%', '50%', '75%', 2.5, 0],
      ['letter grades', 'A', 'C', 'B', 2.5, 1],
    ])('should convert %s', (_label, best, worst, achieved, expected, precision) => {
      expect(convertToGermanGrade(best, worst, achieved)).toBeCloseTo(expected, precision);
    });

    it.each([['invalid letter grade', 'A', 'C', 'Z']])('should return null for %s', (_label, best, worst, achieved) => {
      expect(convertToGermanGrade(best, worst, achieved)).toBeNull();
    });

    describe('empty / whitespace inputs', () => {
      it('should return null when upperLimit is an empty string', () => {
        expect(convertToGermanGrade('', '4.0', '2.0')).toBeNull();
      });

      it('should return null when lowerLimit is an empty string', () => {
        expect(convertToGermanGrade('1.0', '', '2.0')).toBeNull();
      });

      it('should return null when grade is an empty string', () => {
        expect(convertToGermanGrade('1.0', '4.0', '')).toBeNull();
      });

      it('should return null when any input is whitespace-only', () => {
        expect(convertToGermanGrade('   ', '4.0', '2.0')).toBeNull();
        expect(convertToGermanGrade('1.0', '   ', '2.0')).toBeNull();
        expect(convertToGermanGrade('1.0', '4.0', '   ')).toBeNull();
      });
    });

    describe('invalid grade type', () => {
      it('should return null for a special-character grade string', () => {
        expect(convertToGermanGrade('1.0', '4.0', '@#$')).toBeNull();
      });

      it('should return null when grade contains letters mixed with numbers', () => {
        expect(convertToGermanGrade('1.0', '4.0', 'abc123')).toBeNull();
      });
    });

    describe('NaN after parsing', () => {
      it('should return null when upperLimit parses to NaN', () => {
        expect(convertToGermanGrade('%', '50%', '75%')).toBeNull();
      });

      it('should return null when lowerLimit parses to NaN', () => {
        expect(convertToGermanGrade('100%', '%', '75%')).toBeNull();
      });

      it('should return null when grade parses to NaN', () => {
        expect(convertToGermanGrade('100%', '50%', '%')).toBeNull();
      });
    });

    describe('letter grades: "+" modifier on upper limit', () => {
      it('should return 1.0 for A+ when upper limit is A+', () => {
        expect(convertToGermanGrade('A+', 'D', 'A+')).toBe(1.0);
      });

      it('should assign A a value greater than 1.0 when upper limit is A+', () => {
        const result = convertToGermanGrade('A+', 'D', 'A');
        expect(result).not.toBeNull();
        expect(result).toBeGreaterThan(1.0);
        expect(result).toBeLessThan(4.0);
      });

      it('should assign A- a value between A and B when upper limit is A+', () => {
        const forA = convertToGermanGrade('A+', 'D', 'A')!;
        const forAMinus = convertToGermanGrade('A+', 'D', 'A-')!;
        const forB = convertToGermanGrade('A+', 'D', 'B')!;
        expect(forAMinus).toBeGreaterThan(forA);
        expect(forAMinus).toBeLessThan(forB);
      });

      it('should treat "*" as a synonym for "+"', () => {
        expect(convertToGermanGrade('A*', 'D', 'A*')).toBe(convertToGermanGrade('A+', 'D', 'A+'));
      });
    });

    describe('letter grades: "-" modifier on upper limit', () => {
      it('should return 1.0 for A- when upper limit is A-', () => {
        expect(convertToGermanGrade('A-', 'D', 'A-')).toBe(1.0);
      });

      it('should correctly map B+ via the special-case branch', () => {
        const result = convertToGermanGrade('A-', 'D', 'B+');
        expect(result).not.toBeNull();
        expect(result).toBeGreaterThan(1.0);
        expect(result).toBeLessThan(4.0);
      });

      it('should rank B+ closer to 1.0 than B when upper limit is A-', () => {
        expect(convertToGermanGrade('A-', 'D', 'B+')).toBeLessThan(convertToGermanGrade('A-', 'D', 'B')!);
      });
    });

    describe('upper limit equals lower limit', () => {
      it('should return null for identical numeric limits', () => {
        expect(convertToGermanGrade('3.0', '3.0', '3.0')).toBeNull();
      });

      it('should return null for identical percentage limits', () => {
        expect(convertToGermanGrade('75%', '75%', '75%')).toBeNull();
      });

      it('should return null for identical letter limits', () => {
        expect(convertToGermanGrade('A', 'A', 'A')).toBeNull();
      });
    });
  });

  describe('formatGrade', () => {
    it('should format numeric value', () => {
      expect(formatGrade(2.345)).toBe('2.3');
    });

    it('should return null when grade is null', () => {
      expect(formatGrade(null)).toBeNull();
    });
  });

  describe('convertAndFormatGermanGrade', () => {
    it('should convert and format grade', () => {
      expect(convertAndFormatGermanGrade('1.0', '4.0', '2.0')).toBe('2.0');
    });

    describe('null guards for missing inputs', () => {
      it.each([
        ['upperLimit is undefined', undefined, '4.0', '2.0'],
        ['upperLimit is empty string', '', '4.0', '2.0'],
        ['lowerLimit is undefined', '1.0', undefined, '2.0'],
        ['lowerLimit is empty string', '1.0', '', '2.0'],
        ['grade is undefined', '1.0', '4.0', undefined],
        ['grade is empty string', '1.0', '4.0', ''],
        ['all inputs are undefined', undefined, undefined, undefined],
      ])('should return null when %s', (_label, upper, lower, grade) => {
        expect(convertAndFormatGermanGrade(upper, lower, grade)).toBeNull();
      });
    });
  });

  describe('displayGradeWithConversion', () => {
    it.each([
      ['numeric grade', '1.0', '4.0', '2.0', '2.0'],
      ['percentage grade', '100%', '50%', '75%', '2.5'],
      ['letter grade', 'A', 'C', 'B', '2.5'],
    ])('should display %s', (_label, best, worst, achieved, expected) => {
      expect(displayGradeWithConversion(best, worst, achieved)).toBe(expected);
    });

    describe('early exit when grade is missing', () => {
      it('should return empty string when grade is undefined', () => {
        expect(displayGradeWithConversion('1.0', '4.0', undefined)).toBe('');
      });

      it('should return empty string when grade is empty string', () => {
        expect(displayGradeWithConversion('1.0', '4.0', '')).toBe('');
      });
    });

    describe('fallback to empty string when conversion fails', () => {
      it('should return empty string when upperLimit is undefined', () => {
        expect(displayGradeWithConversion(undefined, '4.0', '2.0')).toBe('');
      });

      it('should return empty string when grade type is invalid', () => {
        expect(displayGradeWithConversion('1.0', '4.0', '@#$')).toBe('');
      });
    });
  });
});
