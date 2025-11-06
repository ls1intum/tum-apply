import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator that checks whether an HTML string contains any non-empty visible text.
 *
 * This is useful for validating rich text editor fields (e.g., Quill) where the value
 * may contain HTML tags but no actual user-entered content.
 *
 * If the stripped text content is empty, the validator returns a `{ required: true }` error.
 * Otherwise, it returns `undefined` to indicate valid input.
 *
 * @param control - The form control containing an HTML string.
 * @returns A `ValidationErrors` object if the input is empty, otherwise `undefined`.
 */
export function htmlTextRequiredValidator(control: AbstractControl): ValidationErrors | undefined {
  const htmlText = control.value ?? '';
  // TODO: investigate whether DOM dependency should be removed
  const temp = document.createElement('div');
  temp.innerHTML = htmlText;
  const plainText = (temp.textContent as string | null | undefined) ?? temp.innerText;

  return plainText.length === 0 ? { required: true } : undefined;
}

/**
 * Custom validator that checks whether the plain text content of an HTML string
 * exceeds a specified maximum length.
 *
 * This is useful for validating rich text editor fields (e.g., Quill) where the value
 * may contain HTML tags but only the visible text should count toward the length.
 *
 * @param maxLength - Maximum allowed number of characters.
 * @returns A validator function that returns a `{ maxlength: { requiredLength, actualLength } }`
 *          error if the input exceeds the limit, otherwise `undefined`.
 */
export function htmlTextMaxLengthValidator(maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const htmlText = control.value ?? '';
    const temp = document.createElement('div');
    temp.innerHTML = htmlText;
    const plainText = (temp.textContent as string | null | undefined) ?? temp.innerText;

    const actualLength = plainText.trim().length;

    return actualLength > maxLength ? { maxlength: { requiredLength: maxLength, actualLength } } : null;
  };
}

/**
 * Custom validator that checks whether a TUM ID follows the correct format.
 *
 * TUM IDs must consist of exactly 7 characters:
 * - 2 lowercase letters
 * - 2 digits
 * - 3 lowercase letters
 *
 * Example: ab12cde
 *
 * @param control - The form control containing the TUM ID string.
 * @returns A `ValidationErrors` object with `{ pattern: true }` if invalid, otherwise `undefined`.
 */
export function tumIdValidator(control: AbstractControl): ValidationErrors | undefined {
  const value = control.value;

  // Allow empty values (use Validators.required separately if needed)
  if (!value || value === '') {
    return undefined;
  }

  // Trim whitespace before validating
  const trimmedValue = typeof value === 'string' ? value.trim() : value;

  const tumIdPattern = /^[a-z]{2}[0-9]{2}[a-z]{3}$/;

  return tumIdPattern.test(trimmedValue) ? undefined : { pattern: true };
}
