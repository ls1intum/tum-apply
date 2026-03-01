import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
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
import { MessageComponent } from 'app/shared/components/atoms/message/message.component';
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
  isSpacer?: boolean;
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
  selectedSlotForAssignment = signal<InterviewSlotDTO | null>(null);
  refreshKey = signal(0);
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
      const perPage = this.datesPerPage();
      const remainder = past.length % perPage;
      if (remainder !== 0) {
        const paddingNeeded = perPage - remainder;
        for (let i = 0; i < paddingNeeded; i++) {
          past.push({ date: `spacer-${i}`, localDate: new Date(0), slots: [], isSpacer: true });
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

  canGoPreviousDate = computed(() => this.currentDatePage() > 0);
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  emptyStateMessage = computed<string | null>(() => {
    if (!this.initialized()) return null;
    if (this.hasAnySlots() === false) {
      return 'interview.slots.emptyState.noSlotsCreated';
    }
    if (this.futureSlots().length === 0 && this.pastSlots().length === 0) {
      return 'interview.slots.emptyState.noSlotsInMonth';
    }
    return null;
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

  private readonly pageSizeChangeEffect = effect(
    () => {
      this.datesPerPage();
      this.currentDatePage.set(0);
    },
    { allowSignalWrites: true },
  );

  private readonly initEffect = effect(() => {
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
    this.refreshKey.update(n => n + 1);
    this.showAssignModal.set(true);
  }

  onApplicantAssigned(): void {
    void this.refreshSlots();
    this.slotAssigned.emit();
  }

  private isCurrentMonth(): boolean {
    return this.currentMonthOffset() === 0 || (this.currentYear() === dayjs().year() && this.currentMonthNumber() === dayjs().month() + 1);
  }

  private async checkGlobalSlots(processId: string, showLoading = true): Promise<void> {
    try {
      if (showLoading) {
        this.loading.set(true);
      }

      // Check if ANY slots exist at all
      const anySlotsTask = firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, undefined, undefined, undefined, undefined, 0, 1),
      );

      // Check how many unbooked future slots exist globally for the "Not Enough Slots" warning
      const unbookedTask = firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, undefined, undefined, new Date().toISOString(), undefined, 0, 1000),
      );

      const [anySlotsResponse, unbookedResponse] = await Promise.all([anySlotsTask, unbookedTask]);

      const unbookedCount = unbookedResponse.content?.filter(s => !s.interviewee).length ?? 0;

      untracked(() => {
        this.hasAnySlots.set((anySlotsResponse.totalElements ?? 0) > 0);
        this.globalFutureUnbookedCount.set(unbookedCount);
        this.initialized.set(true);
      });
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
   * @param showLoading - set to false for silent month transitions (no loading spinner).
   *   The loading spinner is only needed for initial load and delete operations.
   */
  private async loadMonthSlots(processId: string, year: number, month: number, newOffset: number, showLoading = true): Promise<void> {
    try {
      this.error.set(false);
      if (showLoading) {
        this.loading.set(true);
      }

      const response = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, year, month, undefined, undefined, 0, 1000),
      );
      const allSlots = response.content ?? [];

      const now = Date.now();
      const past = allSlots.filter(s => new Date(this.safeDate(s.startDateTime)).getTime() < now);
      const future = allSlots.filter(s => new Date(this.safeDate(s.startDateTime)).getTime() >= now);

      // Batch all signal writes to avoid intermediate re-renders between offset, slots and page updates.
      untracked(() => {
        this.currentMonthOffset.set(newOffset);
        this.pastSlots.set(past);
        this.futureSlots.set(future);

        const isCurrent = newOffset === 0 || (year === dayjs().year() && month === dayjs().month() + 1);

        if (isCurrent && future.length > 0) {
          // For the current month, land on the first future-slot page.
          // Past-slot groups are padded with invisible spacers to fill complete pages,
          // so the first future group always starts at index `paddedPastLength`.
          const pastGroupsLength = this.groupByDate(past).length;
          let paddedPastLength = pastGroupsLength;
          const perPage = this.datesPerPage();

          if (pastGroupsLength > 0) {
            const remainder = pastGroupsLength % perPage;
            if (remainder !== 0) {
              paddedPastLength += perPage - remainder;
            }
          }

          this.currentDatePage.set(Math.floor(paddedPastLength / perPage));
        } else {
          this.currentDatePage.set(0);
        }
      });
    } catch {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

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
