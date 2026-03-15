import { describe, it, expect } from 'vitest';
import {
  convertToGermanGrade,
  formatGrade,
  convertAndFormatGermanGrade,
  displayGradeWithConversion,
  formatGradeWithTranslation,
} from 'app/core/util/grade-conversion';
import { createTranslateServiceMock } from 'util/translate.mock';
import { TranslateService } from '@ngx-translate/core';

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
      it.each([
        ['upperLimit is empty', '', '4.0', '2.0'],
        ['lowerLimit is empty', '1.0', '', '2.0'],
        ['grade is empty', '1.0', '4.0', ''],
        ['upperLimit is whitespace', '   ', '4.0', '2.0'],
        ['lowerLimit is whitespace', '1.0', '   ', '2.0'],
        ['grade is whitespace', '1.0', '4.0', '   '],
      ])('should return null when %s', (_label, upper, lower, grade) => {
        expect(convertToGermanGrade(upper, lower, grade)).toBeNull();
      });
    });

    describe('invalid grade type', () => {
      it.each([
        ['special characters', '1.0', '4.0', '@#$'],
        ['letters mixed with numbers', '1.0', '4.0', 'abc123'],
      ])('should return null for %s', (_label, upper, lower, grade) => {
        expect(convertToGermanGrade(upper, lower, grade)).toBeNull();
      });
    });

    describe('NaN after parsing', () => {
      it.each([
        ['upperLimit parses to NaN', '%', '50%', '75%'],
        ['lowerLimit parses to NaN', '100%', '%', '75%'],
        ['grade parses to NaN', '100%', '50%', '%'],
      ])('should return null when %s', (_label, upper, lower, grade) => {
        expect(convertToGermanGrade(upper, lower, grade)).toBeNull();
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
        const forA = convertToGermanGrade('A+', 'D', 'A') as number;
        const forAMinus = convertToGermanGrade('A+', 'D', 'A-') as number;
        const forB = convertToGermanGrade('A+', 'D', 'B') as number;
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
        expect(convertToGermanGrade('A-', 'D', 'B+')).toBeLessThan(convertToGermanGrade('A-', 'D', 'B') as number);
      });
    });

    describe('upper limit equals lower limit', () => {
      it.each([
        ['numeric', '3.0', '3.0', '3.0'],
        ['percentage', '75%', '75%', '75%'],
        ['letter', 'A', 'A', 'A'],
      ])('should return null for identical %s limits', (_label, upper, lower, grade) => {
        expect(convertToGermanGrade(upper, lower, grade)).toBeNull();
      });
    });
  });

  describe('formatGrade', () => {
    it.each([
      [2.345, '2.3'],
      [null, null],
    ])('should return %s for input %s', (input, expected) => {
      expect(formatGrade(input)).toBe(expected);
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

    it.each([
      ['grade is undefined', '1.0', '4.0', undefined],
      ['grade is empty string', '1.0', '4.0', ''],
      ['upperLimit is undefined', undefined, '4.0', '2.0'],
      ['grade type is invalid', '1.0', '4.0', '@#$'],
    ])('should return empty string when %s', (_label, best, worst, achieved) => {
      expect(displayGradeWithConversion(best, worst, achieved)).toBe('');
    });
  });

  describe('formatGradeWithTranslation', () => {
    let translateService: TranslateService;

    beforeEach(() => {
      translateService = createTranslateServiceMock() as TranslateService;
    });

    it.each([
      ['grade is undefined', undefined, '4.0', '1.0'],
      ['grade is empty string', '', '4.0', '1.0'],
    ])('should return empty displayValue and wasConverted=false when %s', (_label, grade, upper, lower) => {
      const result = formatGradeWithTranslation(grade, upper, lower, translateService);
      expect(result).toEqual({ displayValue: '', wasConverted: false });
    });

    it.each([
      ['upperLimit is missing', '3.5', undefined, '1.0', '3.5'],
      ['lowerLimit is missing', '3.5', '4.0', undefined, '3.5'],
      ['both limits are missing', '2.0', undefined, undefined, '2.0'],
      ['grade format is invalid', '@#$', '4.0', '1.0', '@#$'],
    ])('should return conversionFailedTooltip when %s', (_label, grade, upper, lower, expectedDisplay) => {
      const result = formatGradeWithTranslation(grade, upper, lower, translateService);
      expect(result.displayValue).toBe(expectedDisplay);
      expect(result.wasConverted).toBe(false);
      expect(result.tooltipText).toBe('evaluation.details.conversionFailedTooltip');
    });

    it.each([
      ['rounded values are equal', '2.0', '1.0', '4.0', '2.0', false, undefined],
      ['conversion differs', '75', '100', '50', '2.5 (75)', true, 'evaluation.details.converterTooltip'],
      ['comma decimal matches', '2,0', '1.0', '4.0', '2,0', false, undefined],
    ])('should handle case when %s', (_label, grade, upper, lower, expectedDisplay, expectedConverted, expectedTooltip) => {
      const result = formatGradeWithTranslation(grade, upper, lower, translateService);
      expect(result.displayValue).toBe(expectedDisplay);
      expect(result.wasConverted).toBe(expectedConverted);
      expect(result.tooltipText).toBe(expectedTooltip);
    });
  });
});
