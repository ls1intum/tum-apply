import { TestBed } from '@angular/core/testing';
import LocalizedDatePipe from 'app/shared/pipes/localized-date.pipe';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it.each([null, undefined, 123 as unknown as string, [] as unknown as string, 'invalid-date', 'not a date', ''])(
    'should return empty string for invalid input %s',
    input => {
      expect(pipe.transform(input)).toBe('');
    },
  );

  it.each([
    ['en', '2024-03-15', '15/03/2024'],
    ['en', '2024-03-15T14:30:00.000Z', '15/03/2024'],
    ['en', '2024-02-29', '29/02/2024'],
    ['de', '2024-03-15', '15.03.2024'],
    ['de', '2024-02-29', '29.02.2024'],
  ])('should format %s lang %s as %s', (lang, input, expected) => {
    mockTranslate.getCurrentLang = vi.fn().mockReturnValue(lang);
    expect(pipe.transform(input)).toBe(expected);
  });

  it.each([null, ''])('should default to English format when getCurrentLang returns %s', value => {
    mockTranslate.getCurrentLang = vi.fn().mockReturnValue(value);
    expect(pipe.transform('2024-06-15')).toBe('15/06/2024');
  });
});
