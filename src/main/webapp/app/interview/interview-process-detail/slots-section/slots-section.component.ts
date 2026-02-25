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
  // Constants
  private readonly MAX_VISIBLE_SLOTS = 3;
  private readonly DEFAULT_DATES_PER_PAGE = 5;

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Inputs
  processId = input.required<string>();
  invitedCount = input(0);

  // Outputs
  slotAssigned = output();

  // Signals
  futureSlots = signal<InterviewSlotDTO[]>([]);
  pastSlots = signal<InterviewSlotDTO[]>([]);
  showingPastSlots = signal(false);
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

  // Computed
  datesPerPage = computed(() => this.breakpointState());
  targetDate = computed(() => dayjs().add(this.currentMonthOffset(), 'month'));
  currentYear = computed(() => this.targetDate().year());
  currentMonthNumber = computed(() => this.targetDate().month() + 1);

  groupedSlots = computed<GroupedSlots[]>(() => {
    const future = this.groupByDate(this.futureSlots());
    const past = this.groupByDate(this.pastSlots());
    // Merge past + future in chronological order
    return [...past, ...future];
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

  canGoPreviousDate = computed(() => {
    if (this.currentDatePage() > 0) return true;
    // Enable left arrow to trigger lazy loading of past slots
    return !this.showingPastSlots() && this.isCurrentMonth();
  });
  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  emptyStateMessage = computed<string | null>(() => {
    // Only show after initialization
    if (!this.initialized()) return null;

    // No slots at all in any month
    if (this.hasAnySlots() === false) {
      return 'interview.slots.emptyState.noSlotsCreated';
    }

    // Current month has no future slots and no past slots loaded
    if (this.futureSlots().length === 0 && this.pastSlots().length === 0) {
      return 'interview.slots.emptyState.noSlotsInMonth';
    }

    return null;
  });

  notEnoughSlots = computed(() => {
    if (!this.initialized()) return false;
    if (!this.isCurrentMonth() && this.currentMonthOffset() < 0) return false;
    const available = this.futureSlots().filter(s => !s.interviewee).length;
    return this.invitedCount() > 0 && available < this.invitedCount();
  });

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


  private readonly initEffect = effect(() => {
    const id = this.processId();
    if (id !== '') {
      void this.checkGlobalSlots(id);
    }
  });

  // Loads future (or all) slots when month changes — guards on initialized
  private readonly loadFutureEffect = effect(() => {
    if (!this.initialized()) return;
    const id = this.processId();
    const year = this.currentYear();
    const month = this.currentMonthNumber();
    if (id !== '') {
      void this.loadFutureSlots(id, year, month);
    }
  });

  // Lazy-loads past slots only when showingPastSlots flips to true
  private readonly loadPastEffect = effect(() => {
    if (!this.showingPastSlots()) return;
    const id = this.processId();
    const year = this.currentYear();
    const month = this.currentMonthNumber();
    if (id !== '') {
      void this.loadPastSlots(id, year, month);
    }
  });

  // Public methods
  openCreateSlotsModal(): void {
    this.showSlotCreationForm.set(true);
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id !== '') {
      await this.loadFutureSlots(id, this.currentYear(), this.currentMonthNumber());
      if (this.showingPastSlots()) {
        await this.loadPastSlots(id, this.currentYear(), this.currentMonthNumber());
      }
    }
  }

  onSlotsCreated(): void {
    this.hasAnySlots.set(true);
    void this.refreshSlots();
  }

  previousMonth(): void {
    this.loading.set(true);
    this.currentMonthOffset.update(currentMonth => currentMonth - 1);
    this.currentDatePage.set(0);
    this.showingPastSlots.set(false);
    this.futureSlots.set([]);
    this.pastSlots.set([]);
  }

  nextMonth(): void {
    this.loading.set(true);
    this.currentMonthOffset.update(currentMonth => currentMonth + 1);
    this.currentDatePage.set(0);
    this.showingPastSlots.set(false);
    this.futureSlots.set([]);
    this.pastSlots.set([]);
  }

  previousDatePage(): void {
    if (this.currentDatePage() > 0) {
      this.currentDatePage.update(currentPage => currentPage - 1);
    } else if (!this.showingPastSlots() && this.isCurrentMonth()) {
      this.showingPastSlots.set(true);
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
      await this.loadFutureSlots(this.processId(), this.currentYear(), this.currentMonthNumber());

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
  private isCurrentMonth(): boolean {
    return this.currentMonthOffset() === 0 || (this.currentYear() === dayjs().year() && this.currentMonthNumber() === dayjs().month() + 1);
  }

  private async checkGlobalSlots(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      const response = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId, undefined, undefined, undefined, undefined, 0, 1),
      );
      this.hasAnySlots.set((response.totalElements ?? 0) > 0);
    } catch {
      this.error.set(true);
    } finally {
      this.initialized.set(true);
      this.loading.set(false);
    }
  }

  private async loadFutureSlots(processId: string, year: number, month: number): Promise<void> {
    try {
      this.error.set(false);

      const isCurrentOrFuture = this.isCurrentMonth() || this.currentMonthOffset() > 0;
      let response;

      if (isCurrentOrFuture) {
        // Current or future month: fetch only future slots
        const now = new Date().toISOString();
        response = await firstValueFrom(this.interviewService.getSlotsByProcessId(processId, year, month, now, undefined, 0, 1000));
        this.futureSlots.set(response.content ?? []);
      } else {
        // Past month: all slots are "past" — put them all into pastSlots, clear futureSlots
        response = await firstValueFrom(this.interviewService.getSlotsByProcessId(processId, year, month, undefined, undefined, 0, 1000));
        this.pastSlots.set(response.content ?? []);
        this.futureSlots.set([]);
      }
    } catch {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPastSlots(processId: string, year: number, month: number): Promise<void> {
    try {
      const now = new Date().toISOString();
      const response = await firstValueFrom(this.interviewService.getSlotsByProcessId(processId, year, month, undefined, now, 0, 1000));
      this.pastSlots.set(response.content ?? []);
    } catch {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
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
