beforeEach(() => {
  vi.clearAllMocks();
});
import { describe, it, expect } from 'vitest';

import { trimWebsiteUrl } from 'app/shared/util/util';

describe('trimWebsiteUrl', () => {
  it('returns empty string for empty input', () => {
    expect(trimWebsiteUrl('')).toBe('');
  });

  it('removes https and www and trailing slash', () => {
    expect(trimWebsiteUrl('https://www.tum.de/')).toBe('tum.de');
  });

  it('removes http and path segments', () => {
    expect(trimWebsiteUrl('http://tum.de/path/page')).toBe('tum.de');
  });

  it('preserves subdomain and port and removes query and fragment', () => {
    const url = 'https://subdomain.tum.de:8080/path?x=1#frag';
    expect(trimWebsiteUrl(url)).toBe('subdomain.tum.de:8080');
  });

  it('removes www when no scheme present', () => {
    expect(trimWebsiteUrl('www.example.com/page')).toBe('example.com');
  });

  it('handles domain only input unchanged', () => {
    expect(trimWebsiteUrl('example.com')).toBe('example.com');
  });

  it('handles IP addresses with port correctly', () => {
    expect(trimWebsiteUrl('http://127.0.0.1:4200/app')).toBe('127.0.0.1:4200');
  });

  it('removes query and hash-only urls', () => {
    expect(trimWebsiteUrl('https://www.tum.de#anchor')).toBe('tum.de');
  });

  it('returns quirky result for non-http schemes (documented behavior)', () => {
    // the implementation only strips http(s) so ftp:// will not be handled and will result in 'ftp:'
    expect(trimWebsiteUrl('ftp://example.com')).toBe('ftp:');
  });
});
