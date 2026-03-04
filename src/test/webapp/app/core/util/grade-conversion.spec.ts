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
});
