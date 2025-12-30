import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { InterviewBookingResourceApiService } from 'app/generated/api/interviewBookingResourceApi.service';
import { BookingDTO } from 'app/generated/model/bookingDTO';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { DateHeaderComponent } from 'app/interview/interview-process-detail/slots-section/date-header/date-header.component';
import { SelectableSlotCardComponent } from './selectable-slot-card/selectable-slot-card.component';
import { BookingSummaryComponent } from './booking-summary/booking-summary.component';

@Component({
  selector: 'jhi-interview-booking',
  standalone: true,
  imports: [
    RouterLink,
    FontAwesomeModule,
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    SelectableSlotCardComponent,
    BookingSummaryComponent,
    DateHeaderComponent,
  ],
  templateUrl: './interview-booking.component.html',
})
export class InterviewBookingComponent {
  // Constants
  private readonly DATES_PER_PAGE = 7;

  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(InterviewBookingResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  // Signals
  bookingData = signal<BookingDTO | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedSlot = signal<InterviewSlotDTO | null>(null);
  currentMonthOffset = signal(0);
  currentDatePage = signal(0);

  // Computed (Locale)
  private readonly locale = computed(() => {
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  });

  // Computed
  jobTitle = computed(() => this.bookingData()?.jobTitle ?? '');
  supervisor = computed(() => this.bookingData()?.supervisor);
  researchGroupName = computed(() => this.bookingData()?.researchGroupName);

  supervisorName = computed(() => {
    const s = this.supervisor();
    if (!s) return '';
    return `${s.firstName} ${s.lastName}`;
  });

  hasBookedSlot = computed(() => this.bookingData()?.userBookingInfo?.hasBookedSlot ?? false);
  bookedSlot = computed(() => this.bookingData()?.userBookingInfo?.bookedSlot);

  bookedSlotDate = computed(() => {
    const slot = this.bookedSlot();
    if (!slot?.startDateTime) return '';
    return new Date(slot.startDateTime).toLocaleDateString(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  bookedSlotTime = computed(() => {
    const slot = this.bookedSlot();
    if (!slot?.startDateTime || !slot.endDateTime) return '';
    const locale = this.locale();
    const start = new Date(slot.startDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const end = new Date(slot.endDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  });

  isBookedVirtual = computed(() => this.bookedSlot()?.location === 'virtual');

  // Computed (Grouping & Pagination)
  groupedSlots = computed(() => {
    const data = this.bookingData();
    if (!data?.availableSlots?.length) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();
    const slots = data.availableSlots;

    slots.forEach(slot => {
      const localDate = new Date(this.safeDate(slot.startDateTime));
      const dateKey = localDate.toISOString().split('T')[0];

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(slot);
    });

    return Array.from(grouped.entries())
      .map(([dateKey, dateSlots]) => ({
        date: dateKey,
        localDate: new Date(dateKey),
        slots: dateSlots.sort((a, b) => this.safeDate(a.startDateTime) - this.safeDate(b.startDateTime)),
      }))
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());
  });

  currentMonthSlots = computed(() => {
    const allDates = this.groupedSlots();
    const offset = this.currentMonthOffset();

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + offset);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    return allDates.filter(group => {
      return group.localDate.getMonth() === targetMonth && group.localDate.getFullYear() === targetYear;
    });
  });

  paginatedSlots = computed(() => {
    const monthDates = this.currentMonthSlots();
    const page = this.currentDatePage();
    const start = page * this.DATES_PER_PAGE;
    const end = start + this.DATES_PER_PAGE;
    return monthDates.slice(start, end);
  });

  totalDatePages = computed(() => Math.ceil(this.currentMonthSlots().length / this.DATES_PER_PAGE));
  canGoPreviousDate = computed(() => this.currentDatePage() > 0);
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  currentMonthLabel = computed(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + this.currentMonthOffset());
    return targetDate.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' });
  });

  // Effects
  private readonly loadEffect = effect(() => {
    const processId = this.route.snapshot.paramMap.get('processId');
    if (processId) {
      void this.loadData(processId);
    }
  });

  // Methods
  onSlotSelected(slot: InterviewSlotDTO): void {
    if (this.selectedSlot()?.id === slot.id) {
      this.selectedSlot.set(null);
    } else {
      this.selectedSlot.set(slot);
    }
  }

  onBook(): void {
    const slot = this.selectedSlot();
    if (!slot) return;

    console.log('Booking slot:', slot);
    this.toastService.showInfoKey('interview.booking.bookedSuccessPlaceholder');
    // TODO: Call API when endpoint exists
  }

  previousMonth(): void {
    this.currentMonthOffset.update(v => v - 1);
    this.currentDatePage.set(0);
  }

  nextMonth(): void {
    this.currentMonthOffset.update(v => v + 1);
    this.currentDatePage.set(0);
  }

  previousDatePage(): void {
    if (this.canGoPreviousDate()) this.currentDatePage.update(v => v - 1);
  }

  nextDatePage(): void {
    if (this.canGoNextDate()) this.currentDatePage.update(v => v + 1);
  }

  // Private
  private async loadData(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      const data = await firstValueFrom(this.bookingService.getBookingData(processId));
      this.bookingData.set(data);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private safeDate(value?: string): number {
    return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  }
}
