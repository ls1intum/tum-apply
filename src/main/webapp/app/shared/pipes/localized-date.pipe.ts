import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';

/**
 * LocalizedDatePipe
 * Transforms an ISO date string (YYYY-MM-DD) or (YYYY-MM-DDTHH:mm:ss.sssZ) into a localized display string.
 * - en: dd/mm/yyyy
 * - de: dd.mm.yyyy
 * Returns the input if parsing fails.
 */
@Pipe({
  name: 'localizedDate',
  standalone: true,
  pure: false,
})
export default class LocalizedDatePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (value === null || value === undefined || typeof value !== 'string') return '';

    const lang = this.translate.getCurrentLang() || 'en';
    const fmt = lang === 'de' ? 'DD.MM.YYYY' : 'DD/MM/YYYY';

    const loose = dayjs(value);
    if (!loose.isValid()) return '';
    return loose.format(fmt);
  }
}
