import { Component, computed, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ProfessorDTO } from 'app/generated/model/professorDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';

// Summary panel for interview booking.
// Displays job info, supervisor, selected slot details and book button.
@Component({
  selector: 'jhi-booking-summary',
  standalone: true,
  imports: [FontAwesomeModule, TranslateModule, TranslateDirective, ButtonComponent],
  templateUrl: './booking-summary.component.html',
})
export class BookingSummaryComponent {
  // Services
  private readonly translateService = inject(TranslateService);

  // Inputs
  jobTitle = input.required<string>();
  researchGroupName = input<string>();
  supervisor = input.required<ProfessorDTO>();
  selectedSlot = input<InterviewSlotDTO | null>(null);

  // Outputs
  book = output<void>();

  // Computed
  hasSelection = computed(() => this.selectedSlot() !== null);

  supervisorName = computed(() => {
    const s = this.supervisor();
    return `${s.firstName} ${s.lastName}`;
  });

  formattedDate = computed(() => {
    const slot = this.selectedSlot();
    if (!slot?.startDateTime) return '';
    return new Date(slot.startDateTime).toLocaleDateString(this.getLocale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  formattedTime = computed(() => {
    const slot = this.selectedSlot();
    if (!slot?.startDateTime || !slot.endDateTime) return '';
    const locale = this.getLocale();
    const start = new Date(slot.startDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const end = new Date(slot.endDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  });

  isVirtual = computed(() => this.selectedSlot()?.location === 'virtual');

  private getLocale(): string {
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }
}
