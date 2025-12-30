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

/** Interview booking page for applicants. Allows selecting and booking an interview slot. */
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
    return s === undefined ? '' : `${s.firstName} ${s.lastName}`;
  });

  // Computed - Booking Status
  hasBookedSlot = computed(() => this.bookingData()?.userBookingInfo?.hasBookedSlot ?? false);
  bookedSlot = computed(() => this.bookingData()?.userBookingInfo?.bookedSlot ?? null);

  /** Formats the booked slot date for display. */
  bookedSlotDate = computed(() => {
    const startDateTime = this.bookedSlot()?.startDateTime;
    if (startDateTime === undefined || startDateTime === '') return '';
    return new Date(startDateTime).toLocaleDateString(this.locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  /** Formats the booked slot time range for display. */
  bookedSlotTime = computed(() => {
    const slot = this.bookedSlot();
    const start = slot?.startDateTime;
    const end = slot?.endDateTime;
    if (start === undefined || start === '' || end === undefined || end === '') return '';
    const loc = this.locale();
    return `${new Date(start).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })} - ${new Date(end).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}`;
  });

  /** Returns location string or translated virtual/in-person label. */
  bookedSlotLocation = computed(() => {
    const slot = this.bookedSlot();
    if (slot === null) return '';
    const loc = slot.location;
    if (loc !== undefined && loc !== '' && loc !== 'virtual') return loc;
    return this.translateService.instant(loc === 'virtual' ? 'interview.slots.location.virtual' : 'interview.slots.location.inPerson');
  });

  isBookedVirtual = computed(() => this.bookedSlot()?.location === 'virtual');

  /** Groups available slots by date and sorts chronologically. */
  groupedSlots = computed(() => {
    const slots = this.bookingData()?.availableSlots;
    if (slots === undefined || slots.length === 0) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();
    slots.forEach(slot => {
      const dateKey = new Date(this.safeDate(slot.startDateTime)).toISOString().split('T')[0];
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
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

  /** Filters slots to only show the currently selected month. */
  currentMonthSlots = computed(() => {
    const allDates = this.groupedSlots();
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + this.currentMonthOffset());
    return allDates.filter(g => g.localDate.getMonth() === targetDate.getMonth() && g.localDate.getFullYear() === targetDate.getFullYear());
  });

  /** Returns the current page of date groups for display. */
  paginatedSlots = computed(() => {
    const start = this.currentDatePage() * this.DATES_PER_PAGE;
    return this.currentMonthSlots().slice(start, start + this.DATES_PER_PAGE);
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

  // Constants
  private readonly DATES_PER_PAGE = 4;

  // Services
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(InterviewBookingResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  // Signals
  private readonly langChange = toSignal(this.translateService.onLangChange);

  // Effects
  private readonly loadEffect = effect(() => {
    const processId = this.route.snapshot.paramMap.get('processId');
    if (processId !== null && processId !== '') void this.loadData(processId);
  });

  /** Toggles slot selection. */
  onSlotSelected(slot: InterviewSlotDTO): void {
    this.selectedSlot.set(this.selectedSlot()?.id === slot.id ? null : slot);
  }

  /** Initiates booking for the selected slot. */
  onBook(): void {
    if (this.selectedSlot() === null) return;
    // TODO: Call booking API when endpoint exists
    this.toastService.showInfoKey('interview.booking.bookedSuccessPlaceholder');
  }

  /** Navigates to the previous month. */
  previousMonth(): void {
    this.currentMonthOffset.update(v => v - 1);
    this.currentDatePage.set(0);
  }

  /** Navigates to the next month. */
  nextMonth(): void {
    this.currentMonthOffset.update(v => v + 1);
    this.currentDatePage.set(0);
  }

  /** Navigates to the previous date page. */
  previousDatePage(): void {
    if (this.canGoPreviousDate()) this.currentDatePage.update(v => v - 1);
  }

  /** Navigates to the next date page. */
  nextDatePage(): void {
    if (this.canGoNextDate()) this.currentDatePage.update(v => v + 1);
  }

  /** Returns visible slots for a date, respecting expansion state. */
  getVisibleSlots(dateKey: string, allSlots: InterviewSlotDTO[]): InterviewSlotDTO[] {
    return this.expandedDates().has(dateKey) || allSlots.length <= this.MAX_VISIBLE_SLOTS
      ? allSlots
      : allSlots.slice(0, this.MAX_VISIBLE_SLOTS);
  }

  /** Returns count of hidden slots for a date. */
  getRemainingCount(dateKey: string, totalSlots: number): number {
    return this.expandedDates().has(dateKey) ? 0 : Math.max(0, totalSlots - this.MAX_VISIBLE_SLOTS);
  }

  /** Checks if a date group is expanded. */
  isExpanded(dateKey: string): boolean {
    return this.expandedDates().has(dateKey);
  }

  /** Toggles expansion state for a date group. */
  toggleExpanded(dateKey: string): void {
    const expanded = new Set(this.expandedDates());
    expanded.has(dateKey) ? expanded.delete(dateKey) : expanded.add(dateKey);
    this.expandedDates.set(expanded);
  }

  /** Returns translated "show more" text with count. */
  getShowMoreText(count: number): string {
    const key = count === 1 ? 'interview.slots.showMoreSingular' : 'interview.slots.showMorePlural';
    return `${count} ${this.translateService.instant(key)}`;
  }

  /** Returns current locale based on language setting. */
  private locale(): string {
    this.langChange();
    return this.translateService.currentLang === 'de' ? 'de-DE' : 'en-US';
  }

  /** Loads booking data from the API. */
  private async loadData(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      this.bookingData.set(await firstValueFrom(this.bookingService.getBookingData(processId)));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /** Safely converts date string to timestamp. */
  private safeDate(value?: string): number {
    return value === undefined || value === '' ? Number.POSITIVE_INFINITY : new Date(value).getTime();
  }
}
