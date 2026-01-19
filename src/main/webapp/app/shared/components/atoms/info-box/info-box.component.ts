import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

import TranslateDirective from '../../../language/translate.directive';

type InfoBoxSeverity = 'primary' | 'secondary';

@Component({
  selector: 'jhi-info-box',
  standalone: true,
  imports: [FontAwesomeModule, TranslateDirective],
  templateUrl: './info-box.component.html',
})
export class InfoBoxComponent {
  /**
   * The message to display in the info box.
   * Can be a translation key if shouldTranslate is true.
   */
  message = input<string>('');

  /**
   * The severity/type of the info box (matches ButtonComponent severity types).
   * Determines the color scheme.
   */
  severity = input<InfoBoxSeverity>('primary');

  /**
   * Whether to translate the message using the translation key.
   */
  shouldTranslate = input<boolean>(false);

  /**
   * Custom icon to display. If not provided, uses default based on severity.
   */
  icon = input<IconName | undefined>(undefined);

  /**
   * Icon prefix (e.g., 'fas', 'far', 'fab').
   */
  iconPrefix = input<IconPrefix>('fas');

  /**
   * Get the default icon based on severity.
   */
  defaultIcon = computed(() => {
    const iconMap: Record<InfoBoxSeverity, IconName> = {
      primary: 'info-circle',
      secondary: 'info-circle',
    };
    return this.icon() ?? iconMap[this.severity()];
  });

  /**
   * Get CSS classes for the container based on severity.
   * Uses PrimeNG color variables for consistency.
   */
  containerClasses = computed(() => {
    const baseClasses = 'flex items-center gap-3 p-4 border-l-4 rounded-sm';
    const severityClasses: Record<InfoBoxSeverity, string> = {
      primary: 'bg-[var(--p-background-surface)] border-[var(--p-primary-color)]',
      secondary: 'bg-[var(--p-border-default)] border-[var(--p-text-disabled)]',
    };
    return `${baseClasses} ${severityClasses[this.severity()]}`;
  });

  /**
   * Get CSS classes for the icon based on severity.
   * Uses PrimeNG color variables for consistency.
   */
  iconClasses = computed(() => {
    const baseClasses = 'text-xl mt-0.5';
    const severityClasses: Record<InfoBoxSeverity, string> = {
      primary: 'text-[var(--p-primary-color)]',
      secondary: 'text-[var(--p-text-disabled)]',
    };
    return `${baseClasses} ${severityClasses[this.severity()]}`;
  });
}
