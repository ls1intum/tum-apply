import { describe, expect, it } from 'vitest';

import { trimWebsiteUrl } from 'app/shared/util/util';

describe('trimWebsiteUrl', () => {
  it.each([
    ['', ''],
    ['https://www.tum.de/', 'tum.de'],
    ['http://tum.de/path/page', 'tum.de'],
    ['https://subdomain.tum.de:8080/path?x=1#frag', 'subdomain.tum.de:8080'],
    ['www.example.com/page', 'example.com'],
    ['example.com', 'example.com'],
    ['http://127.0.0.1:4200/app', '127.0.0.1:4200'],
    ['https://www.tum.de#anchor', 'tum.de'],
    ['ftp://example.com', 'ftp:'],
  ])('should trim %s to %s', (input, expected) => {
    expect(trimWebsiteUrl(input)).toBe(expected);
  });
});
