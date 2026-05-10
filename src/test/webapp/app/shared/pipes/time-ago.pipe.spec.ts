import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TimeAgoPipe } from 'app/shared/pipes/time-ago.pipe';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    const mockTranslate = createTranslateServiceMock();
    mockTranslate.instant = (key: string, params?: any) => {
      if (key === 'time.justNow') return 'just now';
      if (key === 'time.ago') return `${params.count} ${params.unit} ago`;
      if (key.startsWith('time.units.')) return key.replace('time.units.', '').replace('Plural', 's');
      return key;
    };
    TestBed.configureTestingModule({
      providers: [provideTranslateMock(mockTranslate)],
    });
    pipe = TestBed.runInInjectionContext(() => new TimeAgoPipe());
  });

  it.each(['', undefined as unknown as string])('should return empty string for falsy value %s', value => {
    expect(pipe.transform(value)).toBe('');
  });

  it.each([
    [0, 'just now'],
    [30 * 1000, 'just now'],
    [2 * 60 * 1000, '2 minutes ago'],
    [3 * 60 * 60 * 1000, '3 hours ago'],
    [2 * 24 * 60 * 60 * 1000, '2 days ago'],
    [3 * 30 * 24 * 60 * 60 * 1000, '3 months ago'],
    [2 * 365 * 24 * 60 * 60 * 1000, '2 years ago'],
  ])('should format offset %i ms as "%s"', (offsetMs, expected) => {
    expect(pipe.transform(new Date(Date.now() - offsetMs))).toBe(expected);
  });

  it('should handle string date input', () => {
    const dateStr = new Date(Date.now() - 60 * 1000).toISOString();
    expect(pipe.transform(dateStr)).toBe('1 minute ago');
  });
});
