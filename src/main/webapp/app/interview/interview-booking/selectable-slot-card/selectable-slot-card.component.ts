import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import TranslateDirective from 'app/shared/language/translate.directive';

@Component({
  selector: 'jhi-selectable-slot-card',
  standalone: true,
  imports: [FontAwesomeModule, TranslateModule, TranslateDirective],
  templateUrl: './selectable-slot-card.component.html',
})
export class SelectableSlotCardComponent {
  // Services
  private readonly translateService = inject(TranslateService);

  // Inputs
  slot = input.required<InterviewSlotDTO>();
  selected = input<boolean>(false);

  // Outputs
  slotSelected = output<InterviewSlotDTO>();

  // Signals
  private readonly currentLang = toSignal(this.translateService.onLangChange);

  // Computed
  private readonly locale = computed(() => {
    this.currentLang();
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  });

  timeRange = computed(() => {
    const start = this.formatTime(this.slot().startDateTime);
    const end = this.formatTime(this.slot().endDateTime);
    return `${start} - ${end}`;
  });

  duration = computed(() => {
    const start = new Date(this.slot().startDateTime ?? '');
    const end = new Date(this.slot().endDateTime ?? '');
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins} min`;
  });

  isVirtual = computed(() => {
    return this.slot().location?.toLowerCase() === 'virtual';
  });

  // Methods
  onSelect(): void {
    this.slotSelected.emit(this.slot());
  }

  // Private
  private formatTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
  }
}
