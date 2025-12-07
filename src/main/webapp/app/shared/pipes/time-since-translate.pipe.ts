import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'timeSinceTranslate', standalone: true, pure: false })
export class TimeSinceTranslatePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (!value) return '';

    const lower = value.toLowerCase();

    if (lower === 'today') return this.translate.instant('time.today');
    if (lower === 'yesterday') return this.translate.instant('time.yesterday');
    if (lower === 'a few seconds ago' || lower === 'few seconds ago') return this.translate.instant('time.justNow');

    // Pattern: "X <unit>(s) ago" -> use time.ago and time.units.*
    const m = lower.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/);
    if (m) return this.formatRelative(m);

    return value;
  }

  private formatRelative(match: RegExpMatchArray): string {
    const count = Number(match[1]);
    const unit = match[2];
    const unitLabel = this.translate.instant(`time.units.${unit}${count > 1 ? 'Plural' : ''}`);
    return this.translate.instant('time.ago', { count, unit: unitLabel });
  }
}
