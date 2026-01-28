import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs/esm';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { SlotCreationFormComponent } from 'app/interview/interview-process-detail/slots-section/slot-creation-form/slot-creation-form.component';
import { getLocale } from 'app/shared/util/date-time.util';

import { MonthNavigationComponent } from './month-navigation/month-navigation.component';
import { DateHeaderComponent } from './date-header/date-header.component';
import { SlotCardComponent } from './slot-card/slot-card.component';
import { AssignApplicantModalComponent } from './assign-applicant-modal/assign-applicant-modal.component';

interface GroupedSlots {
  date: string;
  localDate: Date;
  slots: InterviewSlotDTO[];
}

@Component({
  selector: 'jhi-slots-section',
  standalone: true,
  imports: [
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    ProgressSpinnerModule,
    MonthNavigationComponent,
    DateHeaderComponent,
    SlotCardComponent,
    SlotCreationFormComponent,
    FontAwesomeModule,
    AssignApplicantModalComponent,
  ],
  templateUrl: './slots-section.component.html',
})
export class SlotsSectionComponent {
  // Inputs
  processId = input.required<string>();
  createSlotsRequest = input<number>(0);

  // Outputs
  slotAssigned = output();

  // Signals
  slots = signal<InterviewSlotDTO[]>([]);
  loading = signal(true);
  isRefreshing = signal(false);
  error = signal(false);
  currentMonthOffset = signal(0);
  currentDatePage = signal(0);
  paginationAnchorIndex = signal(0);
  expandedDates = signal<Set<string>>(new Set());
  showSlotCreationForm = signal(false);
  showAssignModal = signal(false);
  selectedSlotForAssignment = signal<InterviewSlotDTO | null>(null);
  refreshKey = signal(0);
  hasAnySlots = signal<boolean | undefined>(undefined);
  futureSlotsCount = signal<number>(0);

  // Computed
  hasFutureSlots = computed(() => this.futureSlotsCount() > 0);
  groupedSlots = computed<GroupedSlots[]>(() => {
    const slotsData = this.slots();
    if (slotsData.length === 0) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();

    slotsData.forEach(slot => {
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

  targetDate = computed(() => dayjs().add(this.currentMonthOffset(), 'month'));

  currentYear = computed(() => this.targetDate().year());

  currentMonthNumber = computed(() => this.targetDate().month() + 1);

  currentMonthSlots = computed(() => this.groupedSlots());

  paginatedSlots = computed(() => {
    const monthDates = this.currentMonthSlots();
    const anchor = this.paginationAnchorIndex();
    const page = this.currentDatePage();

    // Relative Pagination: Page 0 starts at anchor.
    // Negative pages go backwards from anchor.
    const start = anchor + page * this.DATES_PER_PAGE;

    // Ensure we don't slice before 0
    const sliceStart = Math.max(0, start);
    const sliceEnd = start + this.DATES_PER_PAGE;

    // If start is beyond length (empty future page), return empty array
    if (sliceStart >= monthDates.length) return [];

    return monthDates.slice(sliceStart, sliceEnd);
  });

  currentMonth = computed(() => {
    const date = this.targetDate();
    return date.toDate().toLocaleDateString(this.locale(), {
      month: 'long',
      year: 'numeric',
    });
  });

  hasFutureSlotsInCurrentMonth = computed(() => {
    if (this.currentMonthOffset() !== 0) return true;
    const slots = this.groupedSlots();
    const now = Date.now();
    return slots.some(group => group.slots.some(s => this.safeDate(s.startDateTime) > now));
  });

  totalDatePages = computed(() => {
    return Math.ceil(this.currentMonthSlots().length / this.DATES_PER_PAGE);
  });

  canGoPreviousDate = computed(() => {
    const anchor = this.paginationAnchorIndex();
    const page = this.currentDatePage();
    const start = anchor + page * this.DATES_PER_PAGE;
    return start > 0;
  });

  canGoNextDate = computed(() => {
    const monthDates = this.currentMonthSlots();
    const anchor = this.paginationAnchorIndex();
    const page = this.currentDatePage();
    const startNext = anchor + (page + 1) * this.DATES_PER_PAGE;

    if (startNext >= monthDates.length) {
      // Allow creating the "Empty Future" page if we are viewing past
      const currentStart = anchor + page * this.DATES_PER_PAGE;
      return currentStart < monthDates.length;
    }
    return true;
  });

  // Constants
  private readonly MAX_VISIBLE_SLOTS = 3;
  private readonly DATES_PER_PAGE = 5;

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  // Private signals
  private readonly langChangeSignal = toSignal(this.translateService.onLangChange);
  private readonly currentLangSignal = signal(this.translateService.getBrowserCultureLang() ?? 'en');

  private locale = computed(() => {
    this.currentLangSignal();
    return getLocale(this.translateService);
  });

  // Effects
  private readonly langChangeEffect = effect(() => {
    const langEvent = this.langChangeSignal();
    if (langEvent?.lang !== undefined) {
      this.currentLangSignal.set(langEvent.lang);
    }
  });

  private readonly loadSlotsEffect = effect(() => {
    const id = this.processId();
    const year = this.currentYear();
    const month = this.currentMonthNumber();
    if (id !== '') {
      void this.loadSlots(id, year, month);
    }
  });

  // Effect to update the global slot status key when processId changes
  private readonly slotStatusEffect = effect(() => {
    void this.refreshSlotStatus();
  });

  // Effect to open the create slots modal when requested by parent
  private readonly createSlotsRequestEffect = effect(() => {
    const request = this.createSlotsRequest();
    if (request > 0) {
      this.openCreateSlotsModal();
    }
  });

  // Public methods
  openCreateSlotsModal(): void {
    this.showSlotCreationForm.set(true);
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id !== '') {
      await this.loadSlots(id, this.currentYear(), this.currentMonthNumber());
      void this.refreshSlotStatus();
    }
  }

  onSlotsCreated(): void {
    this.hasAnySlots.set(true);
    void this.refreshSlots();
  }

  previousMonth(): void {
    this.currentMonthOffset.update(currentMonth => currentMonth - 1);
    this.currentDatePage.set(0);
  }

  nextMonth(): void {
    this.currentMonthOffset.update(currentMonth => currentMonth + 1);
    this.currentDatePage.set(0);
  }

  previousDatePage(): void {
    if (this.canGoPreviousDate()) {
      this.currentDatePage.update(currentPage => currentPage - 1);
    }
  }

  nextDatePage(): void {
    if (this.canGoNextDate()) {
      this.currentDatePage.update(currentPage => currentPage + 1);
    }
  }

  getVisibleSlots(dateKey: string, allSlots: InterviewSlotDTO[]): InterviewSlotDTO[] {
    const isExpanded = this.expandedDates().has(dateKey);
    if (isExpanded || allSlots.length <= this.MAX_VISIBLE_SLOTS) {
      return allSlots;
    }
    return allSlots.slice(0, this.MAX_VISIBLE_SLOTS);
  }

  getRemainingCount(dateKey: string, totalSlots: number): number {
    const isExpanded = this.expandedDates().has(dateKey);
    if (isExpanded) return 0;
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

  onEditSlot(): void {
    // TODO: Open Edit Modal
  }

  async onDeleteSlot(slot: InterviewSlotDTO): Promise<void> {
    const slotId = slot.id;
    if (slotId === undefined) {
      return;
    }

    try {
      this.loading.set(true);

      await firstValueFrom(this.interviewService.deleteSlot(slotId));
      await this.loadSlots(this.processId(), this.currentYear(), this.currentMonthNumber());
      void this.refreshSlotStatus();

      this.toastService.showSuccessKey('interview.slots.delete.success');
    } catch (error: unknown) {
      const httpError = error as { status?: number };
      if (httpError.status === 400) {
        this.toastService.showErrorKey('interview.slots.delete.errorBooked');
      } else if (httpError.status === 403) {
        this.toastService.showErrorKey('interview.slots.delete.errorForbidden');
      } else {
        this.toastService.showErrorKey('interview.slots.delete.error');
      }
    } finally {
      this.loading.set(false);
    }
  }

  onAssignApplicant(slot: InterviewSlotDTO): void {
    this.selectedSlotForAssignment.set(slot);
    this.refreshKey.update(n => n + 1);
    this.showAssignModal.set(true);
  }

  onApplicantAssigned(): void {
    void this.refreshSlots();
    this.slotAssigned.emit();
  }

  // Private methods
  // Check if any slots exist (for empty state) and if future slots exist (for add button)
  private async refreshSlotStatus(): Promise<void> {
    try {
      // Just check if any slots exist
      const response = await firstValueFrom(this.interviewService.getSlotsByProcessId(this.processId(), undefined, undefined, 0, 1));
      this.hasAnySlots.set((response.totalElements ?? 0) > 0);

      const futureCount = await firstValueFrom(this.interviewService.countAvailableFutureSlots(this.processId()));
      this.futureSlotsCount.set(futureCount);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Loads slots for a specific month and updates the local state.
   * If it's the current month, it calculates an anchor index to focus on today/future slots.
   *
   * @param processId The interview process ID
   * @param year The year to load
   * @param month The month to load (1-12)
   */
  private async loadSlots(processId: string, year: number, month: number): Promise<void> {
    const isInitialLoad = this.hasAnySlots() === undefined;

    try {
      if (isInitialLoad) {
        this.loading.set(true);
      } else {
        this.isRefreshing.set(true);
        this.slots.set([]);
      }
      this.error.set(false);

      // Server side filtering by year and month
      const response = await firstValueFrom(this.interviewService.getSlotsByProcessId(processId, year, month, 0, 1000));

      const slotsList = response.content ?? [];
      this.slots.set(slotsList);

      if (this.currentMonthOffset() === 0) {
        const anchorIndex = this.calculateFutureSlotsIndex(slotsList);
        this.paginationAnchorIndex.set(anchorIndex);
      } else {
        // For other months, start at the beginning
        this.paginationAnchorIndex.set(0);
      }

      // Always reset page to 0 (the anchor view)
      this.currentDatePage.set(0);

      if (this.hasAnySlots() === undefined) {
        this.hasAnySlots.set((response.totalElements ?? 0) > 0);
      }
    } catch {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    } finally {
      this.loading.set(false);
      this.isRefreshing.set(false);
    }
  }

  /**
   * Calculates the index of the first group of slots that is either today or in the future.
   * This is used for "Relative Pagination" to anchor the view to the relevant dates.
   *
   * 1. Groups slots by date locally.
   * 2. Sorts groups chronologically.
   * 3. Finds the first group date that is >= Today.
   *
   * @param slots The list of fetched slots
   * @return The index of the future/today group, or the end/length if all are past.
   */
  private calculateFutureSlotsIndex(slots: InterviewSlotDTO[]): number {
    // Calculate groups locally to ensure we use the fresh data
    const grouped = new Map<string, InterviewSlotDTO[]>();
    slots.forEach(slot => {
      const localDate = new Date(this.safeDate(slot.startDateTime));
      const dateKey = localDate.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(slot);
    });

    // Sort groups by date
    const localSlotsByDate = Array.from(grouped.entries())
      .map(([dateKey, dateSlots]) => ({
        date: dateKey,
        slots: dateSlots,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const todayStr = new Date().toISOString().split('T')[0];

    // Find index of group that is today or in the future
    const futureOrTodayIndex = localSlotsByDate.findIndex(group => group.date >= todayStr);

    if (futureOrTodayIndex >= 0) {
      return futureOrTodayIndex;
    } else if (localSlotsByDate.length > 0) {
      // All past -> Anchor at end (Empty page)
      return localSlotsByDate.length;
    }

    return 0;
  }

  private safeDate(value?: string): number {
    return value !== undefined && value !== '' ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  }
}
