import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import TranslateDirective from 'app/shared/language/translate.directive';

/** Selectable slot card for interview booking. Displays time, duration, and location. */
@Component({
  selector: 'jhi-selectable-slot-card',
  standalone: true,
  imports: [FontAwesomeModule, TranslateModule, TranslateDirective],
  templateUrl: './selectable-slot-card.component.html',
})
export class SelectableSlotCardComponent {
  // Inputs
  slot = input.required<InterviewSlotDTO>();
  selected = input<boolean>(false);

  // Outputs
  slotSelected = output<InterviewSlotDTO>();

  // Computed
  /** Formats time range as "HH:MM - HH:MM". */
  timeRange = computed(() => `${this.formatTime(this.slot().startDateTime)} - ${this.formatTime(this.slot().endDateTime)}`);

  /** Calculates and formats duration in minutes. */
  duration = computed(() => {
    const start = this.slot().startDateTime;
    const end = this.slot().endDateTime;
    if (start === undefined || start === '' || end === undefined || end === '') return '';
    return `${Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)} min`;
  });

  /** Checks if slot is virtual. */
  isVirtual = computed(() => this.slot().location?.toLowerCase() === 'virtual');

  // Services
  private readonly translateService = inject(TranslateService);

  // Signals
  private readonly langChange = toSignal(this.translateService.onLangChange);

  // Computed
  private readonly locale = computed(() => {
    this.langChange();
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  });

  /** Emits slot selection event. */
  onSelect(): void {
    this.slotSelected.emit(this.slot());
  }

  /** Formats date string to localized time. */
  private formatTime(date?: string): string {
    if (date === undefined || date === '') return '';
    return new Date(date).toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
  }
}
