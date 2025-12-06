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
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value !== 'string') {
      return '';
    }
    if (value.trim() === '') {
      return '';
    }

    const parts = value.split('-');
    if (parts.length !== 3) {
      return value;
    }

    const [yStr, mStr, dStr] = parts;
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
      return value;
    }

    const lang = this.translate.getCurrentLang() || 'en';
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year).padStart(4, '0');

    if (lang === 'de') {
      return `${dd}.${mm}.${yyyy}`;
    }
    return `${mm}/${dd}/${yyyy}`;
  }
}
