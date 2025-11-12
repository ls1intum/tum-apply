import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

import TranslateDirective from '../../../language/translate.directive';

type InfoBoxSeverity = 'primary' | 'secondary';

@Component({
  selector: 'jhi-info-box',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateDirective],
  templateUrl: './info-box.component.html',
})
export class InfoBoxComponent {
  /**
   * The message to display in the info box.
   * Can be a translation key if shouldTranslate is true.
   */
  @Input() message = '';

  /**
   * The severity/type of the info box (matches ButtonComponent severity types).
   * Determines the color scheme.
   */
  @Input() severity: InfoBoxSeverity = 'primary';

  /**
   * Whether to translate the message using the translation key.
   */
  @Input() shouldTranslate = false;

  /**
   * Custom icon to display. If not provided, uses default based on severity.
   */
  @Input() icon?: IconName;

  /**
   * Icon prefix (e.g., 'fas', 'far', 'fab').
   */
  @Input() iconPrefix: IconPrefix = 'fas';

  /**
   * Get the default icon based on severity.
   */
  get defaultIcon(): IconName {
    const iconMap: Record<InfoBoxSeverity, IconName> = {
      primary: 'info-circle',
      secondary: 'info-circle',
    };
    return this.icon ?? iconMap[this.severity];
  }

  /**
   * Get CSS classes for the container based on severity.
   * Uses PrimeNG color variables for consistency.
   */
  get containerClasses(): string {
    const baseClasses = 'flex items-center gap-3 p-4 rounded-r-lg border-l-4';
    const severityClasses: Record<InfoBoxSeverity, string> = {
      primary: 'bg-[var(--p-primary-50)] border-[var(--p-primary-color)]',
      secondary: 'bg-[var(--p-surface-100)] border-[var(--p-surface-500)]',
    };
    return `${baseClasses} ${severityClasses[this.severity]}`;
  }

  /**
   * Get CSS classes for the icon based on severity.
   * Uses PrimeNG color variables for consistency.
   */
  get iconClasses(): string {
    const baseClasses = 'text-xl mt-0.5';
    const severityClasses: Record<InfoBoxSeverity, string> = {
      primary: 'text-[var(--p-primary-color)]',
      secondary: 'text-[var(--p-surface-500)]',
    };
    return `${baseClasses} ${severityClasses[this.severity]}`;
  }
}
