import { TestBed } from '@angular/core/testing';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { vi } from 'vitest';

describe('LocalizedDatePipe', () => {
  let pipe: LocalizedDatePipe;
  let mockTranslate: ReturnType<typeof createTranslateServiceMock>;

  beforeEach(() => {
    mockTranslate = createTranslateServiceMock();
    mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');

    TestBed.configureTestingModule({
      providers: [provideTranslateMock(mockTranslate)],
    });
    pipe = TestBed.runInInjectionContext(() => new LocalizedDatePipe());
  });

  it.each([[null], [undefined], [123 as unknown as string], [[] as unknown as string], ['invalid-date'], ['not a date'], ['']])(
    'should return empty string for invalid input %s',
    input => {
      expect(pipe.transform(input)).toBe('');
    },
  );

  describe('English (en) date formatting', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
    });

    it.each([
      ['2024-03-15', '15/03/2024'],
      ['2024-03-15T14:30:00.000Z', '15/03/2024'],
      ['2024-02-29', '29/02/2024'],
    ])('should format %s in English format as %s', (input, expected) => {
      expect(pipe.transform(input)).toBe(expected);
    });
  });

  describe('German (de) date formatting', () => {
    beforeEach(() => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
    });

    it.each([
      ['2024-03-15', '15.03.2024'],
      ['2024-03-15T14:30:00.000Z', '15.03.2024'],
      ['2024-02-29', '29.02.2024'],
    ])('should format %s in German format as %s', (input, expected) => {
      expect(pipe.transform(input)).toBe(expected);
    });
  });

  describe('Language switching', () => {
    it('should switch format when language changes from en to de', () => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('en');
      expect(pipe.transform('2024-01-01')).toBe('01/01/2024');

      mockTranslate.getCurrentLang = vi.fn().mockReturnValue('de');
      expect(pipe.transform('2024-12-31')).toBe('31.12.2024');
    });

    it.each([[null], ['']])('should default to English format when getCurrentLang returns %s', value => {
      mockTranslate.getCurrentLang = vi.fn().mockReturnValue(value);
      expect(pipe.transform('2024-06-15')).toBe('15/06/2024');
    });
  });
});
