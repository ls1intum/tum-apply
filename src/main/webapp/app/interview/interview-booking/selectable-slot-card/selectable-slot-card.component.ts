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
  // Inputs
  slot = input.required<InterviewSlotDTO>();
  selected = input<boolean>(false);

  // Outputs
  slotSelected = output<InterviewSlotDTO>();

  // Computed
  timeRange = computed(() => {
    const start = this.formatTime(this.slot().startDateTime);
    const end = this.formatTime(this.slot().endDateTime);
    return `${start} - ${end}`;
  });

  duration = computed(() => {
    const startDateTime = this.slot().startDateTime;
    const endDateTime = this.slot().endDateTime;
    if (startDateTime === undefined || startDateTime === '' || endDateTime === undefined || endDateTime === '') {
      return '';
    }
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins} min`;
  });

  isVirtual = computed(() => {
    return this.slot().location?.toLowerCase() === 'virtual';
  });

  // Services
  private readonly translateService = inject(TranslateService);

  // Signals
  private readonly langChange = toSignal(this.translateService.onLangChange);

  // Computed
  private readonly locale = computed(() => {
    this.langChange();
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  });

  // Methods
  onSelect(): void {
    this.slotSelected.emit(this.slot());
  }

  private formatTime(date?: string): string {
    if (date === undefined || date === '') return '';
    return new Date(date).toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
  }
}
