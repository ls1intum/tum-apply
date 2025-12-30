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
  // Inputs
  jobTitle = input.required<string>();
  researchGroupName = input<string>();
  supervisor = input<ProfessorDTO>();
  selectedSlot = input<InterviewSlotDTO | null>(null);
  alreadyBooked = input(false);
  bookedDate = input<string>('');
  bookedTime = input<string>('');
  bookedIsVirtual = input(false);
  bookedLocation = input<string | undefined>(undefined);

  // Outputs
  book = output();

  // Computed
  hasSelection = computed(() => this.selectedSlot() !== null);

  supervisorName = computed(() => {
    const s = this.supervisor();
    if (s === undefined) return '';
    return `${s.firstName} ${s.lastName}`;
  });

  formattedDate = computed(() => {
    const slot = this.selectedSlot();
    const startDateTime = slot?.startDateTime;
    if (startDateTime === undefined || startDateTime === '') return '';
    return new Date(startDateTime).toLocaleDateString(this.getLocale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  formattedTime = computed(() => {
    const slot = this.selectedSlot();
    const startDateTime = slot?.startDateTime;
    const endDateTime = slot?.endDateTime;
    if (startDateTime === undefined || startDateTime === '' || endDateTime === undefined || endDateTime === '') {
      return '';
    }
    const locale = this.getLocale();
    const start = new Date(startDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const end = new Date(endDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  });

  isVirtual = computed(() => this.selectedSlot()?.location === 'virtual');

  displayDate = computed(() => (this.alreadyBooked() ? this.bookedDate() : this.formattedDate()));
  displayTime = computed(() => (this.alreadyBooked() ? this.bookedTime() : this.formattedTime()));
  displayIsVirtual = computed(() => (this.alreadyBooked() ? this.bookedIsVirtual() : this.isVirtual()));

  displayLocation = computed(() => {
    const location = this.alreadyBooked() ? this.bookedLocation() : this.selectedSlot()?.location;
    if (location !== undefined && location !== '' && location !== 'virtual') return location;
    return null;
  });

  displayLocationKey = computed(() => {
    return this.displayIsVirtual() ? 'interview.slots.location.virtual' : 'interview.slots.location.inPerson';
  });

  // Services
  private readonly translateService = inject(TranslateService);

  // Signals
  private readonly langChange = toSignal(this.translateService.onLangChange);

  // Private
  private getLocale(): string {
    this.langChange();
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }
}
