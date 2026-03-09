import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs/esm';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { MessageComponent } from 'app/shared/components/atoms/message/message.component';
import { SlotCreationFormComponent } from 'app/interview/interview-process-detail/slots-section/slot-creation-form/slot-creation-form.component';
import { getLocale } from 'app/shared/util/date-time.util';
import { BREAKPOINTS } from 'app/shared/constants/breakpoints';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { CheckboxComponent } from 'app/shared/components/atoms/checkbox/checkbox.component';
import { CancelInterviewDTO } from 'app/generated/model/cancelInterviewDTO';

import { MonthNavigationComponent } from './month-navigation/month-navigation.component';
import { DateHeaderComponent } from './date-header/date-header.component';
import { SlotCardComponent } from './slot-card/slot-card.component';
import { AssignApplicantModalComponent } from './assign-applicant-modal/assign-applicant-modal.component';

interface GroupedSlots {
  date: string;
  localDate: Date;
  slots: InterviewSlotDTO[];
  isHiddenPaddingDay?: boolean;
}

@Component({
  selector: 'jhi-slots-section',
  standalone: true,
  imports: [
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    MonthNavigationComponent,
    DateHeaderComponent,
    SlotCardComponent,
    SlotCreationFormComponent,
    FontAwesomeModule,
    AssignApplicantModalComponent,
    DialogComponent,
    CheckboxComponent,
    MessageComponent,
  ],
  templateUrl: './slots-section.component.html',
})
export class SlotsSectionComponent {
  // Constants
  readonly MAX_VISIBLE_SLOTS = 3;
  readonly DEFAULT_DATES_PER_PAGE = 5;

  // Services
  readonly interviewService = inject(InterviewResourceApiService);
  readonly translateService = inject(TranslateService);
  readonly toastService = inject(ToastService);
  readonly breakpointObserver = inject(BreakpointObserver);

  // Inputs
  processId = input.required<string>();
  isClosed = input<boolean>(false);
  refreshKey = input<number>(0);
  invitedCount = input(0);

  // Outputs
  slotAssigned = output();

  // Signals
  futureSlots = signal<InterviewSlotDTO[]>([]);
  pastSlots = signal<InterviewSlotDTO[]>([]);
  initialized = signal(false);
  loading = signal(true);
  error = signal(false);
  currentMonthOffset = signal(0);
  currentDatePage = signal(0);
  expandedDates = signal<Set<string>>(new Set());
  showSlotCreationForm = signal(false);
  showAssignModal = signal(false);
  selectedSlotForAssignment = signal<InterviewSlotDTO | undefined>(undefined);

  showCancelModal = signal(false);
  selectedSlotForCancel = signal<InterviewSlotDTO | undefined>(undefined);
  cancelSendReinvite = signal(false);
  cancelDeleteSlot = signal(true);

  internalRefreshKey = signal(0);
  hasAnySlots = signal<boolean | undefined>(undefined);
  globalFutureUnbookedCount = signal<number>(0);

  // Computed
  datesPerPage = computed(() => {
    return this.breakpointState();
  });
  targetDate = computed(() => dayjs().add(this.currentMonthOffset(), 'month'));
  currentYear = computed(() => this.targetDate().year());
  currentMonthNumber = computed(() => this.targetDate().month() + 1);

  groupedSlots = computed<GroupedSlots[]>(() => {
    const future = this.groupByDate(this.futureSlots());
    const past = this.groupByDate(this.pastSlots());

    if (past.length > 0 && future.length > 0) {
      const columnsPerPage = this.datesPerPage();
      const pastColumnsInLastPage = past.length % columnsPerPage;
      if (pastColumnsInLastPage !== 0) {
        const emptyPaddingColumnsNeeded = columnsPerPage - pastColumnsInLastPage;
        for (let i = 0; i < emptyPaddingColumnsNeeded; i++) {
          past.push({ date: `spacer-${i}`, localDate: new Date(0), slots: [], isHiddenPaddingDay: true });
        }
      }
    }

    return past.concat(future);
  });

  currentMonthSlots = computed(() => this.groupedSlots());

  paginatedSlots = computed(() => {
    const monthDates = this.currentMonthSlots();
    const pageSize = this.datesPerPage();
    const page = this.currentDatePage();
    const start = page * pageSize;
    const end = start + pageSize;
    const groups = monthDates.slice(start, end);
    const expandedSet = this.expandedDates();

    return groups.map(group => {
      const expanded = expandedSet.has(group.date);
      const visibleSlots =
        expanded || group.slots.length <= this.MAX_VISIBLE_SLOTS ? group.slots : group.slots.slice(0, this.MAX_VISIBLE_SLOTS);
      const remainingCount = expanded ? 0 : Math.max(0, group.slots.length - this.MAX_VISIBLE_SLOTS);
      const showMoreLabel = expanded ? 'interview.detail.showLess' : this.getShowMoreText(remainingCount);

      return {
        date: group.date,
        localDate: group.localDate,
        slots: group.slots,
        isHiddenPaddingDay: group.isHiddenPaddingDay,
        visibleSlots,
        expanded,
        remainingCount,
        showMoreLabel,
      };
    });
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

  canGoPreviousDate = computed(() => this.currentDatePage() > 0);
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  emptyStateMessage = computed<string | undefined>(() => {
    if (!this.initialized()) return undefined;
    if (this.hasAnySlots() === false) {
      return 'interview.slots.emptyState.noSlotsCreated';
    }
    if (this.futureSlots().length === 0 && this.pastSlots().length === 0) {
      return 'interview.slots.emptyState.noSlotsInMonth';
    }
    return undefined;
  });

  notEnoughSlots = computed(() => {
    if (!this.initialized()) return false;
    return this.invitedCount() > 0 && this.globalFutureUnbookedCount() < this.invitedCount();
  });

  // Private Signals (state + toSignal)
  private readonly langChangeSignal = toSignal(this.translateService.onLangChange);
  private readonly currentLangSignal = signal(this.translateService.getBrowserCultureLang());

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

  // Private Computed
  private readonly locale = computed(() => {
    this.currentLangSignal();
    return getLocale(this.translateService);
  });

  // Private Effects
  private readonly langChangeEffect = effect(() => {
    const langEvent = this.langChangeSignal();
    if (langEvent?.lang !== undefined) {
      this.currentLangSignal.set(langEvent.lang);
    }
  });

  private readonly pageSizeChangeEffect = effect(() => {
    this.datesPerPage();
    this.currentDatePage.set(0);
  });

  private readonly initEffect = effect(() => {
    this.refreshKey(); // track external refresh key
    this.internalRefreshKey(); // track internal refresh key
    const id = this.processId();
    if (id !== '') {
      void this.checkGlobalSlots(id);
    }
  });

  openCreateSlotsModal(): void {
    this.showSlotCreationForm.set(true);
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id !== '') {
      await this.checkGlobalSlots(id);
    }
  }

  onSlotsCreated(): void {
    this.hasAnySlots.set(true);
    void this.refreshSlots();
  }

  async previousMonth(): Promise<void> {
    const id = this.processId();
    if (id !== '') {
      const prevOffset = this.currentMonthOffset() - 1;
      const target = dayjs().add(prevOffset, 'month');
      await this.loadMonthSlots(id, target.year(), target.month() + 1, prevOffset, false);
    }
  }

  async nextMonth(): Promise<void> {
    const id = this.processId();
    if (id !== '') {
      const nextOffset = this.currentMonthOffset() + 1;
      const target = dayjs().add(nextOffset, 'month');
      await this.loadMonthSlots(id, target.year(), target.month() + 1, nextOffset, false);
    }
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

  toggleExpanded(dateKey: string): void {
    const expanded = new Set(this.expandedDates());
    if (expanded.has(dateKey)) {
      expanded.delete(dateKey);
    } else {
      expanded.add(dateKey);
    }
    this.expandedDates.set(expanded);
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
      // Opt out of global loading to prevent UI flicker, we could add a local loading spinner later if needed
      await firstValueFrom(this.interviewService.deleteSlot(slotId));
      await this.checkGlobalSlots(this.processId(), false);

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
    }
  }

  onAssignApplicant(slot: InterviewSlotDTO): void {
    this.selectedSlotForAssignment.set(slot);
    this.internalRefreshKey.update(n => n + 1);
    this.showAssignModal.set(true);
  }

  onApplicantAssigned(updatedSlot?: InterviewSlotDTO): void {
    if (updatedSlot) {
      this.futureSlots.update(slots => slots.map(s => (s.id === updatedSlot.id ? updatedSlot : s)));
      this.pastSlots.update(slots => slots.map(s => (s.id === updatedSlot.id ? updatedSlot : s)));
    } else {
      void this.refreshSlots();
    }
    this.slotAssigned.emit();
  }

  onCancelInterview(slot: InterviewSlotDTO): void {
    this.selectedSlotForCancel.set(slot);
    this.cancelSendReinvite.set(true);
    this.cancelDeleteSlot.set(false);
    this.showCancelModal.set(true);
  }

  async onCancelInterviewConfirm(): Promise<void> {
    const slot = this.selectedSlotForCancel();
    if (slot?.id == null) return;

    try {
      const cancelParams: CancelInterviewDTO = {
        sendReinvite: this.cancelSendReinvite(),
        deleteSlot: this.cancelDeleteSlot(),
      };

      await firstValueFrom(this.interviewService.cancelInterview(this.processId(), slot.id, cancelParams));

      // Hier rufen wir die NEUE main-Methode auf, um die Daten neu zu laden!
      await this.checkGlobalSlots(this.processId(), false);

      this.toastService.showSuccessKey('interview.slots.cancelInterview.success');
    } catch {
      this.toastService.showErrorKey('interview.slots.cancelInterview.error');
    } finally {
      this.showCancelModal.set(false);
      this.selectedSlotForCancel.set(undefined);
    }
  }

  // Private methods
  private getShowMoreText(count: number): string {
    const key = count === 1 ? 'interview.slots.showMoreSingular' : 'interview.slots.showMorePlural';
    return `${count} ${this.translateService.instant(key)}`;
  }

  /**
   * Performs the initial data check for this interview process by firing two
   * lightweight REST calls in parallel, then loads the current month's slots.
   *
   * Separate calls are necessary because each serves a distinct purpose:
   * 1. `anySlotsTask` — fetches a single slot (page size 1) to determine whether
   *    the process has ANY slots at all. This drives the empty-state UI.
   * 2. `unbookedTask` — fetches all future slots (afterDateTime = now) so we can
   *    count unbooked ones across ALL months for the global "Not Enough Slots" warning.
   *    A month-scoped query would miss slots in other months and produce false warnings.
   *
   * After both resolve, [loadMonthSlots](cci:1://file:///Users/abinayasivaguru/LokalTUMApply/src/main/webapp/app/interview/interview-process-detail/slots-section/slots-section.component.ts:443:2-515:3) is called to populate the calendar view.
   *
   * @param processId - the interview process ID
   * @param showLoading - whether to show the loading spinner (false for silent refreshes, e.g. after delete)
   */
  private async checkGlobalSlots(processId: string, showLoading = true): Promise<void> {
    try {
      if (showLoading) {
        this.loading.set(true);
      }

      // 1. Check if ANY slots exist (page size 1 — we only need totalElements)
      const anySlotsTask = firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, undefined, undefined, undefined, undefined, 0, 1),
      );

      // 2. Fetch all future slots to count unbooked ones globally (across all months)
      const unbookedTask = firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, undefined, undefined, new Date().toISOString(), undefined, 0, 1000),
      );

      // 3. Run both in parallel — they are independent queries
      const [anySlotsResponse, unbookedResponse] = await Promise.all([anySlotsTask, unbookedTask]);

      // 4. Count future unbooked slots for the "Not Enough Slots" warning
      const unbookedCount = unbookedResponse.content?.filter(s => !s.interviewee).length ?? 0;

      // 5. Batch signal writes to avoid intermediate re-renders
      untracked(() => {
        this.hasAnySlots.set((anySlotsResponse.totalElements ?? 0) > 0);
        this.globalFutureUnbookedCount.set(unbookedCount);
        this.initialized.set(true);
      });

      // 6. Load the current month's slots for the calendar view
      await this.loadMonthSlots(processId, this.currentYear(), this.currentMonthNumber(), this.currentMonthOffset(), showLoading);
    } catch {
      untracked(() => {
        this.error.set(true);
        this.initialized.set(true);
        if (showLoading) {
          this.loading.set(false);
        }
      });
    }
  }

  /**
   * Fetches all slots for the given month and partitions them into past/future.
   * All signal writes are batched inside `untracked()` to produce a single re-render.
   *
   * Steps:
   * 1. Fetch all slots for the month via a single API call (year + month filter)
   * 2. Partition them into past and future based on current time
   * 3. Determine the initial date page — for the current month, auto-navigate
   *    to the first page containing future slots so users see upcoming slots first
   * 4. Batch all signal writes to avoid flickering from intermediate states
   *
   * @param processId - the interview process ID
   * @param year - target year
   * @param month - target month (1-based)
   * @param newOffset - month offset from today (0 = current month)
   * @param showLoading - set to false for silent month transitions (no loading spinner).
   *   The loading spinner is only needed for initial load and delete operations.
   */
  private async loadMonthSlots(processId: string, year: number, month: number, newOffset: number, showLoading = true): Promise<void> {
    try {
      this.error.set(false);
      if (showLoading) {
        this.loading.set(true);
      }

      // 1. Fetch all slots for the target month
      const response = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, year, month, undefined, undefined, 0, 1000),
      );
      const allSlots = response.content ?? [];

      // 2. Partition into past and future based on current time
      const now = Date.now();
      const past = allSlots.filter(s => new Date(this.safeDate(s.startDateTime)).getTime() < now);
      const future = allSlots.filter(s => new Date(this.safeDate(s.startDateTime)).getTime() >= now);

      // 3. Batch all signal writes to avoid intermediate re-renders
      untracked(() => {
        this.currentMonthOffset.set(newOffset);
        this.pastSlots.set(past);
        this.futureSlots.set(future);

        // 4. Auto-navigate to the first future-slot page for the current month
        const isCurrent = newOffset === 0 || (year === dayjs().year() && month === dayjs().month() + 1);

        if (isCurrent && future.length > 0) {
          // Past-slot groups are padded with invisible spacers to fill complete pages,
          // so the first future group always starts at index `paddedPastLength`.
          const pastGroupsLength = this.groupByDate(past).length;
          let paddedPastLength = pastGroupsLength;
          const columnsPerPage = this.datesPerPage();

          if (pastGroupsLength > 0) {
            const pastColumnsInLastPage = pastGroupsLength % columnsPerPage;
            if (pastColumnsInLastPage !== 0) {
              paddedPastLength += columnsPerPage - pastColumnsInLastPage;
            }
          }

          this.currentDatePage.set(Math.floor(paddedPastLength / columnsPerPage));
        } else {
          this.currentDatePage.set(0);
        }
      });
    } catch {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    } finally {
      if (showLoading) {
        this.loading.set(false);
      }
    }
  }

  /**
   * Groups a flat array of InterviewSlotDTOs by their local calendar date.
   * Each group contains all slots for one day, sorted by start time ascending.
   * The groups themselves are sorted chronologically.
   *
   * This grouping is needed because the calendar grid displays slots organized
   * by day columns — each column shows a date header and the day's slot cards.
   *
   * @param slots - flat array of InterviewSlotDTOs (e.g. all past or all future slots for a month)
   * @returns array of GroupedSlots, one per unique date, sorted by date ascending.
   *          Returns empty array if input is empty.
   */
  private groupByDate(slots: InterviewSlotDTO[]): GroupedSlots[] {
    if (slots.length === 0) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();

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
  }

  private safeDate(value?: string): number {
    return value !== undefined && value !== '' ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  }
}
