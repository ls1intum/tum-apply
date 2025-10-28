import { htmlTextRequiredValidator, htmlTextMaxLengthValidator } from 'app/shared/validators/custom-validators';
import { FormControl } from '@angular/forms';
import { describe, it, expect, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HTML text validators', () => {
  it('required validator: uses innerText when textContent is undefined', () => {
    const mockEl: Partial<HTMLElement> = {
      innerHTML: '',
      textContent: undefined,
      innerText: 'visible via innerText',
    };

    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockEl as HTMLElement);

    // Case 1: non-empty innerText -> valid (undefined)
    const valid = htmlTextRequiredValidator(new FormControl('<p>ignored</p>'));
    expect(valid).toBeUndefined();

    // Case 2: empty innerText -> invalid ({ required: true })
    (mockEl as HTMLElement).innerText = '';
    const invalid = htmlTextRequiredValidator(new FormControl('<p>ignored</p>'));
    expect(invalid).toEqual({ required: true });

    createSpy.mockRestore();
  });

  it('maxLength validator: uses innerText when textContent is undefined', () => {
    const mockEl: Partial<HTMLElement> = {
      innerHTML: '',
      textContent: undefined,
      innerText: '123456', // triggers maxlength violation
    };

    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockEl as HTMLElement);

    const validator = htmlTextMaxLengthValidator(5);

    // Case 1: exceeds limit -> returns error
    const tooLong = validator(new FormControl('<p>ignored</p>'));
    expect(tooLong).toEqual({
      maxlength: { requiredLength: 5, actualLength: 6 },
    });

    // Case 2: within limit -> returns null
    (mockEl as HTMLElement).innerText = '12345';
    const ok = validator(new FormControl('<p>ignored</p>'));
    expect(ok).toBeNull();

    createSpy.mockRestore();
  });
});
