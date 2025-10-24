import { describe, it, expect, vi } from 'vitest';
import { extractTextFromHtml } from 'app/shared/util/text.util';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractTextFromHtml', () => {
  it('should extract plain text from HTML', () => {
    expect(extractTextFromHtml('<p>Hello</p>')).toBe('Hello');
  });

  it('should handle nested tags', () => {
    expect(extractTextFromHtml('<div><b>Test</b> Value</div>')).toBe('Test Value');
  });

  it('should return empty string when no text present', () => {
    expect(extractTextFromHtml('<div></div>')).toBe('');
  });

  it('should handle null textContent and undefined trim safely', () => {
    const mockElem = {
      innerHTML: '',
      textContent: null,
      innerText: { trim: (() => undefined) as unknown as () => string },
    };
    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockElem as unknown as HTMLElement);
    expect(extractTextFromHtml('<p>ignored</p>')).toBe('');
    createSpy.mockRestore();
  });
});
