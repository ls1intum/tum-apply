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
    if (this.isEmpty(value)) return '';
    const parsed = this.parseIsoDate(value as string);
    if (!parsed) return value!;
    if (!this.isValid(parsed.y, parsed.m, parsed.d)) return value!;
    const lang = this.translate.getCurrentLang() || 'en';
    return this.format(parsed.y, parsed.m, parsed.d, lang);
  }

  private isEmpty(input: unknown): boolean {
    return input === null || input === undefined || typeof input !== 'string' || input.trim() === '';
  }

  private parseIsoDate(input: string): { y: number; m: number; d: number } | null {
    const m = LocalizedDatePipe.ISO_REGEX.exec(input.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return { y, m: mo, d };
  }

  private isValid(y: number, m: number, d: number): boolean {
    if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return false;
    // Month/day realism (Feb 30, etc.) using Date round-trip
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  private format(y: number, m: number, d: number, lang: string): string {
    const dd = d.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    const yyyy = y.toString();
    return lang === 'de' ? `${dd}.${mm}.${yyyy}` : `${mm}/${dd}/${yyyy}`;
  }
}
