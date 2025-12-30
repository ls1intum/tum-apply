import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
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

/**
 * Interview booking page for applicants.
 * Allows selecting and booking an interview slot from available options.
 */
@Component({
  selector: 'jhi-interview-booking',
  standalone: true,
  imports: [
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
  private readonly DATES_PER_PAGE = 4;
  readonly MAX_VISIBLE_SLOTS = 8;

  // Signals
  bookingData = signal<BookingDTO | null>(null);
  loading = signal(true);
  error = signal(false);
  selectedSlot = signal<InterviewSlotDTO | null>(null);
  currentMonthOffset = signal(0);
  currentDatePage = signal(0);
  expandedDates = signal<Set<string>>(new Set());

  // Computed - Job Info
  jobTitle = computed(() => this.bookingData()?.jobTitle ?? '');
  researchGroupName = computed(() => this.bookingData()?.researchGroupName);
  supervisor = computed(() => this.bookingData()?.supervisor);

  supervisorName = computed(() => {
    const s = this.bookingData()?.supervisor;
    if (!s) return '';
    return `${s.firstName} ${s.lastName}`;
  });

  // Computed - Booking Status
  hasBookedSlot = computed(() => this.bookingData()?.userBookingInfo?.hasBookedSlot ?? false);
  bookedSlot = computed(() => this.bookingData()?.userBookingInfo?.bookedSlot ?? null);

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
    const loc = this.locale();
    const start = new Date(slot.startDateTime).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
    const end = new Date(slot.endDateTime).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  });

  bookedSlotLocation = computed(() => {
    const slot = this.bookedSlot();
    if (!slot) return '';
    if (slot.location && slot.location !== 'virtual') {
      return slot.location;
    }
    return this.translateService.instant(
      slot.location === 'virtual' ? 'interview.slots.location.virtual' : 'interview.slots.location.inPerson',
    );
  });

  isBookedVirtual = computed(() => this.bookedSlot()?.location === 'virtual');

  // Computed - Slot Grouping
  groupedSlots = computed(() => {
    const data = this.bookingData();
    if (!data?.availableSlots?.length) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();

    data.availableSlots.forEach(slot => {
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

    return allDates.filter(group => group.localDate.getMonth() === targetMonth && group.localDate.getFullYear() === targetYear);
  });

  paginatedSlots = computed(() => {
    const monthDates = this.currentMonthSlots();
    const page = this.currentDatePage();
    const start = page * this.DATES_PER_PAGE;
    const end = start + this.DATES_PER_PAGE;
    return monthDates.slice(start, end);
  });

  // Computed - Pagination
  totalDatePages = computed(() => Math.ceil(this.currentMonthSlots().length / this.DATES_PER_PAGE));
  canGoPreviousDate = computed(() => this.currentDatePage() > 0);
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  currentMonthLabel = computed(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + this.currentMonthOffset());
    return targetDate.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' });
  });

  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(InterviewBookingResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly currentLang = toSignal(this.translateService.onLangChange);

  // Effects
  private readonly loadEffect = effect(() => {
    const processId = this.route.snapshot.paramMap.get('processId');
    if (processId) {
      void this.loadData(processId);
    }
  });

  // Methods - Slot Selection
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
  }

  // Methods - Navigation
  previousMonth(): void {
    this.currentMonthOffset.update(v => v - 1);
    this.currentDatePage.set(0);
  }

  nextMonth(): void {
    this.currentMonthOffset.update(v => v + 1);
    this.currentDatePage.set(0);
  }

  previousDatePage(): void {
    if (this.canGoPreviousDate()) {
      this.currentDatePage.update(v => v - 1);
    }
  }

  nextDatePage(): void {
    if (this.canGoNextDate()) {
      this.currentDatePage.update(v => v + 1);
    }
  }

  // Methods - Expand/Collapse
  getVisibleSlots(dateKey: string, allSlots: InterviewSlotDTO[]): InterviewSlotDTO[] {
    const isExpanded = this.expandedDates().has(dateKey);
    if (isExpanded || allSlots.length <= this.MAX_VISIBLE_SLOTS) {
      return allSlots;
    }
    return allSlots.slice(0, this.MAX_VISIBLE_SLOTS);
  }

  getRemainingCount(dateKey: string, totalSlots: number): number {
    if (this.expandedDates().has(dateKey)) return 0;
    return Math.max(0, totalSlots - this.MAX_VISIBLE_SLOTS);
  }

  isExpanded(dateKey: string): boolean {
    return this.expandedDates().has(dateKey);
  }

  toggleExpanded(dateKey: string): void {
    const expanded = new Set(this.expandedDates());
    if (expanded.has(dateKey)) {
      expanded.delete(dateKey);
    } else {
      expanded.add(dateKey);
    }
    this.expandedDates.set(expanded);
  }

  getShowMoreText(count: number): string {
    const key = count === 1 ? 'interview.slots.showMoreSingular' : 'interview.slots.showMorePlural';
    return `${count} ${this.translateService.instant(key)}`;
  }

  // Private
  private locale(): string {
    this.currentLang();
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }

  private async loadData(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
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
