import { AbstractControl, ValidationErrors } from '@angular/forms';

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
  const plainText = temp.textContent ?? temp.innerText;

  return !plainText ? { required: true } : undefined;
}
