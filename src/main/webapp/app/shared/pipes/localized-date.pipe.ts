import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * LocalizedDatePipe
 * Transforms an ISO date string (YYYY-MM-DD) into a localized display string.
 * - en: mm/dd/yyyy
 * - de: dd.mm.yyyy
 * Returns the input if parsing fails.
 */
@Pipe({
  name: 'localizedDate',
  standalone: true,
  // Impure so it re-runs on change detection
  pure: false,
})
export default class LocalizedDatePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (value === null || value === undefined || typeof value !== 'string') return '';

    const trimmed = value.trim();
    if (trimmed === '') return '';

    // Parse strict ISO date (YYYY-MM-DD)
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(trimmed);
    if (!match) return value;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return value;

    const dd = day.toString().padStart(2, '0');
    const mm = month.toString().padStart(2, '0');
    const yyyy = year.toString();

    const lang = this.translate.getCurrentLang() || 'en';
    return lang === 'de' ? `${dd}.${mm}.${yyyy}` : `${mm}/${dd}/${yyyy}`;
  }
}
