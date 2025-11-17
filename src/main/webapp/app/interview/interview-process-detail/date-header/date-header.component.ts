import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-date-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-header.component.html',
})
export class DateHeaderComponent {
  private readonly translateService = inject(TranslateService);

  date = input.required<Date>();
  slotCount = input.required<number>();

  // Get current locale (de or en)
  private locale = computed(() => {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'de' ? 'de-DE' : 'en-US';
  });

  weekday = () => {
    return this.date().toLocaleDateString(this.locale(), { weekday: 'short' }).toUpperCase();
  };

  day = () => {
    return this.date().toLocaleDateString(this.locale(), { day: '2-digit' });
  };
}
