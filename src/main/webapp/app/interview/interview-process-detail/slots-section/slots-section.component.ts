import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
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
import { BREAKPOINTS } from 'app/shared/constants/breakpoints';

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
  expandedDates = signal<Set<string>>(new Set());
  showSlotCreationForm = signal(false);
  showAssignModal = signal(false);
  selectedSlotForAssignment = signal<InterviewSlotDTO | null>(null);
  refreshKey = signal(0);
  hasAnySlots = signal<boolean | undefined>(undefined);
  futureSlotsCount = signal<number>(0);
  showPastSlots = signal(false);

  // Computed
  datesPerPage = computed(() => this.breakpointState());

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
    const pageSize = this.datesPerPage();
    const page = this.currentDatePage();
    const start = page * pageSize;
    const end = start + pageSize;
    return monthDates.slice(start, end);
  });

  currentMonth = computed(() => {
    const date = this.targetDate();
    return date.toDate().toLocaleDateString(this.locale(), {
      month: 'long',
      year: 'numeric',
    });
  });

  totalDatePages = computed(() => {
    return Math.ceil(this.currentMonthSlots().length / this.datesPerPage());
  });

  // Allow going left if: on page > 0, OR on page 0 but not yet showing past slots
  canGoPreviousDate = computed(() => this.currentDatePage() > 0 || !this.showPastSlots());
  // Allow going right if: current page < total pages - 1 (next page exists), OR showing past slots (jump to future)
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1 || this.showPastSlots());

  // Constants
  private readonly MAX_VISIBLE_SLOTS = 3;
  private readonly DEFAULT_DATES_PER_PAGE = 5;

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Private Signals & Computed
  private readonly langChangeSignal = toSignal(this.translateService.onLangChange);
  private readonly currentLangSignal = signal(this.translateService.getBrowserCultureLang() ?? 'en');

  private readonly breakpointState = toSignal(
    this.breakpointObserver
      .observe([
        `(min-width: ${BREAKPOINTS.ultraWide}px)`, // 5 columns (2048px)
        '(min-width: 1700px)', // 4 columns
        `(min-width: ${BREAKPOINTS.xl}px)`, // 3 columns (1300px)
        `(min-width: ${BREAKPOINTS.lg}px)`, // 2 columns (1024px)
      ])
      .pipe(
        map(result => {
          if (result.matches) {
            if (result.breakpoints[`(min-width: ${BREAKPOINTS.ultraWide}px)`]) return 5;
            if (result.breakpoints['(min-width: 1700px)']) return 4;
            if (result.breakpoints[`(min-width: ${BREAKPOINTS.xl}px)`]) return 3;
            if (result.breakpoints[`(min-width: ${BREAKPOINTS.lg}px)`]) return 2;
          }
          return 1;
        }),
      ),
    { initialValue: this.DEFAULT_DATES_PER_PAGE },
  );

  private readonly locale = computed(() => {
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

  private readonly pageSizeChangeEffect = effect(
    () => {
      this.datesPerPage();
      this.currentDatePage.set(0);
    },
    { allowSignalWrites: true },
  );

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
    if (this.currentDatePage() > 0) {
      this.currentDatePage.update(currentPage => currentPage - 1);
    } else if (!this.showPastSlots()) {
      // At page 0 and not showing past slots yet -> toggle to show past slots
      this.showPastSlots.set(true);
      void this.refreshSlots();
    }
  }

  nextDatePage(): void {
    if (this.currentDatePage() < this.totalDatePages() - 1) {
      this.currentDatePage.update(currentPage => currentPage + 1);
    } else if (this.showPastSlots()) {
      // At last page of past slots -> toggle to future slots (Page 0)
      this.showPastSlots.set(false);
      void this.refreshSlots();
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
      // Check if any slots exist at all (futureOnly=false, pastOnly=false)
      const response = await firstValueFrom(this.interviewService.getSlotsByProcessId(this.processId(), undefined, undefined, false, 0, 1, false));
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
      }
      this.error.set(false);

      // Server side filtering: Strict separation
      // If showPastSlots is true -> pastOnly=true, futureOnly=false
      // If showPastSlots is false -> pastOnly=false, futureOnly=true
      const isPastMode = this.showPastSlots();
      const futureOnly = !isPastMode;
      const pastOnly = isPastMode;

      const response = await firstValueFrom(this.interviewService.getSlotsByProcessId(processId, year, month, futureOnly, 0, 1000, pastOnly));

      const slotsList = response.content ?? [];
      this.slots.set(slotsList);

      // If switching to past mode, start at the LAST page (closest to today)
      // If switching to future mode (or initial load), start at page 0 (closest to today)
      if (isPastMode) {
        // Calculate last page index after setting slots
        // Utilizing the computed signal in a non-reactive way here is safe as we just updated slots
        const totalPages = Math.ceil(slotsList.length / this.datesPerPage());
        this.currentDatePage.set(Math.max(0, totalPages - 1));
      } else {
        this.currentDatePage.set(0);
      }

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


  private safeDate(value?: string): number {
    return value !== undefined && value !== '' ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  }
}
