import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-date-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-header.component.html',
})
export class DateHeaderComponent {
  date = input.required<Date>();
  slotCount = input.required<number>();

  private readonly translateService = inject(TranslateService);
  private currentLang = signal<string>(this.translateService.getCurrentLang() || 'en');
  private locale = computed(() => {
    const lang = this.currentLang();
    return lang === 'de' ? 'de-DE' : 'en-US';
  });

  constructor() {
    // Track language changes for reactive locale updates
    effect(
      () => {
        this.translateService.onLangChange.subscribe(event => {
          this.currentLang.set(event.lang);
        });
      },
      { allowSignalWrites: true },
    );
  }

  weekday = (): string => {
    return this.date().toLocaleDateString(this.locale(), { weekday: 'short' }).toUpperCase();
  };

  day = (): string => {
    return this.date().toLocaleDateString(this.locale(), { day: '2-digit' });
  };

  /**
   * Returns properly pluralized slot count text
   */
  slotsText = (): string => {
    const count = this.slotCount();
    const key = count === 1 ? 'interview.slots.slotsCountSingular' : 'interview.slots.slotsCountPlural';
    return `${count} ${this.translateService.instant(key)}`;
  };
}
