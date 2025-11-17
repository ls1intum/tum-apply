import {
  convertToGermanGrade,
  formatGrade,
  convertAndFormatGermanGrade,
  displayGradeWithConversion,
} from '../../../../../../src/main/webapp/app/core/util/grade-conversion';

describe('grade-conversion', () => {
  it('should convert numeric grades', () => {
    expect(convertToGermanGrade('1.0', '4.0', '2.0')).toBeCloseTo(2.0);
    expect(convertToGermanGrade('100', '40', '70')).toBeCloseTo(2.5);
  });

  it('should convert percentage grades', () => {
    expect(convertToGermanGrade('100%', '50%', '75%')).toBeCloseTo(2.5);
  });

  it('should convert letter grades', () => {
  expect(convertToGermanGrade('A+', 'D', 'B')).toBeCloseTo(2.5, 1);
  expect(convertToGermanGrade('A', 'C', 'B')).toBeCloseTo(2.5, 1);
  });

  it('should return null for invalid or out-of-range grades', () => {
    expect(convertToGermanGrade('1.0', '4.0', '5.0')).toBeNull();
    expect(convertToGermanGrade('', '4.0', '2.0')).toBeNull();
    expect(convertToGermanGrade('A', 'C', 'Z')).toBeNull();
  });

  it('should format grade with one decimal', () => {
    expect(formatGrade(2.345)).toBe('2.3');
    expect(formatGrade(null)).toBeNull();
  });

  it('should convert and format in one step', () => {
    expect(convertAndFormatGermanGrade('1.0', '4.0', '2.0')).toBe('2.0');
    expect(convertAndFormatGermanGrade(undefined, '4.0', '2.0')).toBeNull();
  });

  it('should display grade with conversion', () => {
    expect(displayGradeWithConversion('1.0', '4.0', '2.0')).toBe('2.0');
  expect(displayGradeWithConversion('A', 'C', 'B')).toBe('2.5');
    expect(displayGradeWithConversion('1.0', '4.0', undefined)).toBe('');
    expect(displayGradeWithConversion('1.0', '4.0', '5.0')).toBe('');
  });
});
