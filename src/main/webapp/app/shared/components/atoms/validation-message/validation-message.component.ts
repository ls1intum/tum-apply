import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'jhi-validation-message',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './validation-message.component.html',
})
/**
 * Reusable validation message component for displaying form validation errors.
 *
 * @example
 * <jhi-validation-message
 *   message="validation.required"
 *   [shouldTranslate]="true"
 *   [translationParams]="{ field: 'Email' }"
 *   styleClass="mt-2"
 * />
 *
 * @input message - The validation message or i18n key to display
 * @input shouldTranslate - Whether to translate the message (default: true)
 * @input translationParams - Parameters for i18n interpolation
 * @input styleClass - Additional CSS classes to apply
 */
export class ValidationMessageComponent {
  message = input.required<string>();
  shouldTranslate = input<boolean>(true);
  translationParams = input<Record<string, unknown>>({});
  styleClass = input<string>('');
}
