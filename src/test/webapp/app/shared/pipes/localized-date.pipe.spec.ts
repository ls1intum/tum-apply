import { TestBed } from '@angular/core/testing';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { TranslateService } from '@ngx-translate/core';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { vi } from 'vitest';

describe('LocalizedDatePipe', () => {
  let pipe: LocalizedDatePipe;
  let translate: TranslateService;
  let mockTranslate: ReturnType<typeof createTranslateServiceMock>;

  beforeEach(() => {
    mockTranslate = createTranslateServiceMock();
    mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');

    TestBed.configureTestingModule({
      providers: [provideTranslateMock(mockTranslate)],
    });
    translate = TestBed.inject(TranslateService);
    pipe = TestBed.runInInjectionContext(() => new LocalizedDatePipe());
  });

  describe('Null and undefined handling', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(pipe.transform(123 as unknown as string)).toBe('');
      expect(pipe.transform([] as unknown as string)).toBe('');
    });
  });

  describe('Invalid date strings', () => {
    it('should return empty string for invalid date string', () => {
      expect(pipe.transform('invalid-date')).toBe('');
      expect(pipe.transform('not a date')).toBe('');
      expect(pipe.transform('')).toBe('');
    });
  });

  describe('English (en) date formatting', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
    });

    it('should format ISO date string (YYYY-MM-DD) in English format', () => {
      expect(pipe.transform('2024-03-15')).toBe('15/03/2024');
    });

    it('should format ISO datetime string in English format', () => {
      expect(pipe.transform('2024-03-15T14:30:00.000Z')).toBe('15/03/2024');
    });

    it('should handle leap year dates', () => {
      expect(pipe.transform('2024-02-29')).toBe('29/02/2024');
    });
  });

  describe('German (de) date formatting', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
    });

    it('should format ISO date string (YYYY-MM-DD) in German format', () => {
      expect(pipe.transform('2024-03-15')).toBe('15.03.2024');
    });

    it('should format ISO datetime string in German format', () => {
      expect(pipe.transform('2024-03-15T14:30:00.000Z')).toBe('15.03.2024');
    });

    it('should handle leap year dates', () => {
      expect(pipe.transform('2024-02-29')).toBe('29.02.2024');
    });
  });

  describe('Language switching', () => {
    it('should switch format when language changes from en to de', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
      expect(pipe.transform('2024-01-01')).toBe('01/01/2024');

      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
      expect(pipe.transform('2024-12-31')).toBe('31.12.2024');
    });

    it('should default to English format when getCurrentLang returns null', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue(null);
      expect(pipe.transform('2024-06-15')).toBe('15/06/2024');
    });

    it('should default to English format when getCurrentLang returns empty string', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('');
      expect(pipe.transform('2024-06-15')).toBe('15/06/2024');
    });
  });
});
