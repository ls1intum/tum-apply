import { Component, computed, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateService } from '@ngx-translate/core';

import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';

/**
 * Summary panel for interview booking.
 * Displays job info, supervisor, selected slot details and book button.
 */
@Component({
  selector: 'jhi-booking-summary',
  standalone: true,
  imports: [FontAwesomeModule, TranslateDirective, ButtonComponent],
  templateUrl: './booking-summary.component.html',
})
export class BookingSummaryComponent {
  // Inputs
  jobTitle = input.required<string>();
  researchGroupName = input<string>();
  supervisorName = input.required<string>();
  selectedSlot = input<InterviewSlotDTO | null>(null);

  // Outputs
  book = output<void>();

  // Computed
  hasSelection = computed(() => this.selectedSlot() !== null);

  formattedDate = computed(() => {
    const slot = this.selectedSlot();
    if (!slot?.startDateTime) return '';
    return new Date(slot.startDateTime).toLocaleDateString(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  formattedTime = computed(() => {
    const slot = this.selectedSlot();
    if (!slot?.startDateTime || !slot.endDateTime) return '';
    const loc = this.locale();
    const start = new Date(slot.startDateTime).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
    const end = new Date(slot.endDateTime).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
    const mins = this.durationMinutes();
    return `${start} - ${end}, ${mins}min`;
  });

  location = computed(() => this.selectedSlot()?.location ?? '');

  isVirtual = computed(() => this.selectedSlot()?.location === 'virtual');

  // Services
  private readonly translateService = inject(TranslateService);

  // Methods
  onBook(): void {
    this.book.emit();
  }

  // Private
  private locale(): string {
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }

  private durationMinutes(): number {
    const slot = this.selectedSlot();
    if (!slot?.startDateTime || !slot.endDateTime) return 0;
    const start = new Date(slot.startDateTime);
    const end = new Date(slot.endDateTime);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }
}
