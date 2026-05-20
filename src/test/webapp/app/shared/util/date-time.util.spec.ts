import { TranslateService } from '@ngx-translate/core';
import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  formatDate,
  formatDateWithWeekday,
  formatTime,
  formatTimeRange,
  getLocale,
  parseLocalDateString,
  toLocalDateString,
} from 'app/shared/util/date-time.util';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLocale', () => {
  it.each([
    ['de', 'de-DE'],
    ['en', 'en-US'],
    ['fr', 'en-US'],
  ])('should return %s locale mapping as %s', (currentLang, expectedLocale) => {
    const translateService = { getCurrentLang: () => currentLang } as TranslateService;

    expect(getLocale(translateService)).toBe(expectedLocale);
  });
});

describe('formatDate', () => {
  it('should return an empty string for missing date', () => {
    expect(formatDate(undefined, 'en-US')).toBe('');
  });

  it('should format a date with the provided locale', () => {
    const dateSpy = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('formatted date');

    formatDate('2025-02-28', 'en-US');
    expect(dateSpy).toHaveBeenCalledExactlyOnceWith('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
});

describe('formatTime', () => {
  it('should return an empty string for missing date', () => {
    expect(formatTime(undefined, 'en-US')).toBe('');
  });

  it('should format a time with the provided locale', () => {
    const timeSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('14:30');

    formatTime('2025-02-28T14:30:00', 'de-DE');
    expect(timeSpy).toHaveBeenCalledExactlyOnceWith('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  it('should format a time with the default locale when none is provided', () => {
    const timeSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('14:30');

    formatTime('2025-02-28T14:30:00');
    expect(timeSpy).toHaveBeenCalledExactlyOnceWith([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  });
});

describe('formatTimeRange', () => {
  it('should format a time range using the provided locale', () => {
    const timeSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValueOnce('14:30').mockReturnValueOnce('15:00');

    expect(formatTimeRange('2025-02-28T14:30:00', '2025-02-28T15:00:00', 'de-DE')).toBe('14:30 - 15:00');
    expect(timeSpy).toHaveBeenNthCalledWith(1, 'de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(timeSpy).toHaveBeenNthCalledWith(2, 'de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });
});

describe('formatDateWithWeekday', () => {
  it('should return an empty string for missing date', () => {
    expect(formatDateWithWeekday(undefined, 'en-US')).toBe('');
  });

  it('should format a date with weekday using the provided locale', () => {
    const dateSpy = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Friday, 02/28/2025');

    formatDateWithWeekday('2025-02-28', 'en-US');
    expect(dateSpy).toHaveBeenCalledExactlyOnceWith('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  });
});

describe('toLocalDateString', () => {
  it('should convert a date to YYYY-MM-DD using local date values', () => {
    expect(toLocalDateString(new Date(2025, 1, 3, 14, 30, 0, 0))).toBe('2025-02-03');
  });
});

describe('parseLocalDateString', () => {
  it('should parse a valid date as a local midnight date', () => {
    expect(parseLocalDateString('2025-02-28')).toEqual(new Date(2025, 1, 28));
  });

  it.each([undefined, '', '   ', '2025-02', '2025-xx-01', '2025-02-00', '2025-02-30', '2025-13-01', '1900-01-01'])(
    'should return undefined for invalid input %s',
    invalidValue => {
      expect(parseLocalDateString(invalidValue)).toBeUndefined();
    },
  );
});
