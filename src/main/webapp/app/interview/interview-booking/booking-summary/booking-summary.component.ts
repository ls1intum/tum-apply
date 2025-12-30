import { Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  alreadyBooked = input(false);
  bookedDate = input<string>('');
  bookedTime = input<string>('');
  bookedIsVirtual = input(false);
  bookedLocation = input<string | undefined>(undefined);

  // Outputs
  book = output<void>();

  // Signals
  private readonly currentLang = toSignal(this.translateService.onLangChange);

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

  displayDate = computed(() => (this.alreadyBooked() ? this.bookedDate() : this.formattedDate()));
  displayTime = computed(() => (this.alreadyBooked() ? this.bookedTime() : this.formattedTime()));
  displayIsVirtual = computed(() => (this.alreadyBooked() ? this.bookedIsVirtual() : this.isVirtual()));

  // Returns location string if custom, null if should use translation key
  displayLocation = computed(() => {
    const location = this.alreadyBooked() ? this.bookedLocation() : this.selectedSlot()?.location;
    if (location && location !== 'virtual') return location;
    return null;
  });

  // Returns translation key for virtual/in-person
  displayLocationKey = computed(() => {
    return this.displayIsVirtual() ? 'interview.slots.location.virtual' : 'interview.slots.location.inPerson';
  });

  // Private
  private getLocale(): string {
    this.currentLang(); // Register dependency for reactivity
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }
}
