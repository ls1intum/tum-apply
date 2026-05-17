import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import * as postalCodes from 'postal-codes-js';

function trimStringControlValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Custom validator that checks whether an HTML string contains any non-empty visible text.
 *
 * This is useful for validating rich text editor fields (e.g., Quill) where the value
 * may contain HTML tags but no actual user-entered content.
 *
 * If the stripped text content is empty, the validator returns a `{ required: true }` error.
 * Otherwise, it returns `null` to indicate valid input.
 *
 * @param control - The form control containing an HTML string.
 * @returns A `ValidationErrors` object if the input is empty, otherwise `null`.
 */
export function htmlTextRequiredValidator(control: AbstractControl): ValidationErrors | null {
  const htmlText = control.value ?? '';
  const temp = document.createElement('div');
  temp.innerHTML = htmlText;
  const plainText = (temp.textContent as string | null | undefined) ?? temp.innerText;

  return plainText.length === 0 ? { required: true } : null;
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
 *          error if the input exceeds the limit, otherwise `null`.
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
 * @returns A `ValidationErrors` object with `{ pattern: true }` if invalid, otherwise `null`.
 */
export function tumIdValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  // Allow empty values (use Validators.required separately if needed)
  if (!value || value === '') {
    return null;
  }

  // Trim whitespace before validating
  const trimmedValue = typeof value === 'string' ? value.trim() : value;

  const tumIdPattern = /^[a-z]{2}[0-9]{2}[a-z]{3}$/;

  return tumIdPattern.test(trimmedValue) ? null : { pattern: true };
}

/**
 * Custom validator that treats whitespace-only strings as empty values.
 *
 * This is useful for required text inputs where `"   "` should behave the same
 * as an empty string.
 *
 * @param control - The form control containing the value to validate.
 * @returns A `{ required: true }` error if the trimmed value is empty,
 *          otherwise `null`.
 */
export function trimmedRequiredValidator(control: AbstractControl): ValidationErrors | null {
  return trimStringControlValue(control.value).length === 0 ? { required: true } : null;
}

/**
 * Custom validator that checks whether a postal code is valid for a given country.
 *
 * This validator uses the postal-codes-js library to validate postal codes
 * based on the country code. The country is retrieved dynamically via the
 * provided function, allowing the validator to respond to country changes.
 *
 * @param getCountryFn - A function that returns the current country code (e.g., 'US', 'DE').
 * @returns A validator function that returns a `{ invalidPostalCode: string }` error if invalid,
 *          otherwise `null` to indicate valid input.
 *
 * @example
 * ```typescript
 * this.formBuilder.group({
 *   country: ['DE'],
 *   postcode: ['', [Validators.required, postalCodeValidator(() => this.data().country?.value as string)]]
 * });
 * ```
 */
export function postalCodeValidator(getCountryFn: () => string | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const country = getCountryFn()?.toUpperCase();
    const value = trimStringControlValue(control.value);
    if (country === undefined || country.length === 0 || value.length === 0) return null;
    const isPostalCodeValid: boolean | string = postalCodes.validate(country, value);
    const validationError: ValidationErrors = { invalidPostalCode: 'entity.applicationPage1.validation.postalCode' } as ValidationErrors;
    return isPostalCodeValid === true ? null : validationError;
  };
}
