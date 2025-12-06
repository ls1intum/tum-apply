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
  pure: false,
})
export default class LocalizedDatePipe implements PipeTransform {
  private static ISO_REGEX = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  private translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (value === null || value === undefined || typeof value !== 'string') return '';

    const trimmed = value.trim();
    if (trimmed === '') return '';

    // Parse strict ISO date (YYYY-MM-DD)
    const match = LocalizedDatePipe.ISO_REGEX.exec(trimmed);
    if (!match) return value;

    const lang = this.translate.getCurrentLang() || 'en';
    return this.format(Number(match[1]), Number(match[2]), Number(match[3]), lang);
  }

  private format(y: number, m: number, d: number, lang: string): string {
    const dd = d.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const yyyy = y.toString();
    return lang === 'de' ? `${dd}.${mm}.${yyyy}` : `${mm}/${dd}/${yyyy}`;
  }
}
