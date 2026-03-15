import { convertToGermanGrade, formatGrade, convertAndFormatGermanGrade, displayGradeWithConversion, formatGradeWithTranslation } from 'app/core/util/grade-conversion';
import { TranslateService } from '@ngx-translate/core';
import { createTranslateServiceMock } from 'util/translate.mock';

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
  });

  describe('formatGrade', () => {
    it('should format numeric value', () => {
      expect(formatGrade(2.345)).toBe('2.3');
    });
  });

  describe('convertAndFormatGermanGrade', () => {
    it('should convert and format grade', () => {
      expect(convertAndFormatGermanGrade('1.0', '4.0', '2.0')).toBe('2.0');
    });
  });

  describe('displayGradeWithConversion', () => {
    it.each([
      ['numeric grade', '1.0', '4.0', '2.0', '2.0'],
      ['letter grade', 'A', 'C', 'B', '2.5'],
    ])('should display %s', (_label, best, worst, achieved, expected) => {
      expect(displayGradeWithConversion(best, worst, achieved)).toBe(expected);
    });
  });

  describe('formatGradeWithTranslation', () => {
    const translateService = createTranslateServiceMock() as unknown as TranslateService;

    it.each([
      ['conversion differs', '75', '100%', '50%', '2.5 (evaluation.details.converted)', true, 'evaluation.details.converterTooltip'],
      ['grade is the same', '2.0', '1.0', '4.0', '2.0', false, undefined],
      ['empty grade', '', '1.0', '4.0', '', false, undefined],
      ['missing limits', '2.0', undefined, undefined, '2.0', false, 'evaluation.details.conversionFailedTooltip'],
    ])('should handle case when %s', (_label, grade, upper, lower, expectedDisplay, expectedConverted, expectedTooltip) => {
      const result = formatGradeWithTranslation(grade, upper, lower, translateService);
      expect(result.displayValue).toBe(expectedDisplay);
      expect(result.wasConverted).toBe(expectedConverted);
      expect(result.tooltipText).toBe(expectedTooltip);
    });
  });
});
