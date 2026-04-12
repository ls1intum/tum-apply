import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs/esm';
import { getTemplatesResource } from 'app/generated/api/email-template-resource-api';
import { GetSlotsByProcessIdParams, InterviewResourceApi, getSlotsByProcessIdResource } from 'app/generated/api/interview-resource-api';
import { InterviewSlotDTO } from 'app/generated/model/interview-slot-dto';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DialogComponent } from 'app/shared/components/atoms/dialog/dialog.component';
import { MessageComponent } from 'app/shared/components/atoms/message/message.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { SlotCreationFormComponent } from 'app/interview/interview-process-detail/slots-section/slot-creation-form/slot-creation-form.component';
import { formatDateWithWeekday, formatTimeRange, getLocale } from 'app/shared/util/date-time.util';
import { BREAKPOINTS } from 'app/shared/constants/breakpoints';
import { CancelInterviewDTO } from 'app/generated/model/cancel-interview-dto';

import { CancelInterviewModalComponent } from '../cancel-interview-modal/cancel-interview-modal.component';

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
    FormsModule,
    ButtonComponent,
    DialogComponent,
    MessageComponent,
    StringInputComponent,
    MonthNavigationComponent,
    DateHeaderComponent,
    SlotCardComponent,
    SlotCreationFormComponent,
    FontAwesomeModule,
    AssignApplicantModalComponent,
    CancelInterviewModalComponent,
    RouterLink,
  ],
  templateUrl: './slots-section.component.html',
})
export class SlotsSectionComponent {
  // Constants
  readonly MAX_VISIBLE_SLOTS = 3;
  readonly DEFAULT_DATES_PER_PAGE = 5;

  // Services
  readonly interviewApi = inject(InterviewResourceApi);
  readonly translateService = inject(TranslateService);
  readonly toastService = inject(ToastService);
  readonly breakpointObserver = inject(BreakpointObserver);

  // Inputs
  processId = input.required<string>();
  isClosed = input<boolean>(false);
  refreshKey = input<number>(0);
  invitedCount = input(0);

  // Resources for slot queries
  private readonly anySlotsParams = signal<GetSlotsByProcessIdParams>({ page: 0, size: 1 });
  private readonly anySlotsResource = getSlotsByProcessIdResource(this.processId, this.anySlotsParams);

  private readonly futureUnbookedParams = signal<GetSlotsByProcessIdParams>({
    afterDateTime: new Date().toISOString(),
    page: 0,
    size: 1000,
  });
  private readonly futureUnbookedResource = getSlotsByProcessIdResource(this.processId, this.futureUnbookedParams);

  private readonly monthSlotsParams = signal<GetSlotsByProcessIdParams>({ page: 0, size: 1000 });
  private readonly monthSlotsResource = getSlotsByProcessIdResource(this.processId, this.monthSlotsParams);

  // Resource for email templates (to find INTERVIEW_LOCATION_CHANGED template)
  private readonly templatesResource = getTemplatesResource(signal({ pageSize: 100, pageNumber: 0 }));

  // Outputs
  slotAssigned = output();
  hasSlotsChange = output<boolean>();

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
  showEditDialog = signal(false);
  selectedSlotForEdit = signal<InterviewSlotDTO | undefined>(undefined);
  editLocation = signal('');
  editLoading = signal(false);

  selectedSlotForAssignment = signal<InterviewSlotDTO | undefined>(undefined);

  showCancelModal = signal(false);
  selectedSlotForCancel = signal<InterviewSlotDTO | undefined>(undefined);

  internalRefreshKey = signal(0);
  hasAnySlots = signal<boolean | undefined>(undefined);
  globalFutureUnbookedCount = signal<number>(0);
  locationChangedTemplateId = signal<string | undefined>(undefined);

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

  editSlotDate = computed(() => {
    const slot = this.selectedSlotForEdit();
    if (slot?.startDateTime === undefined || slot.startDateTime === '') return '';
    return formatDateWithWeekday(slot.startDateTime, this.locale());
  });

  editSlotTimeRange = computed(() => {
    const slot = this.selectedSlotForEdit();
    if (slot?.startDateTime === undefined || slot.startDateTime === '' || slot.endDateTime === undefined || slot.endDateTime === '')
      return '';
    return formatTimeRange(slot.startDateTime, slot.endDateTime);
  });

  editSlotIsBooked = computed(() => {
    return this.selectedSlotForEdit()?.isBooked ?? false;
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

  // Effect: React to global slots resource results (anySlots + futureUnbooked)
  private readonly globalSlotsEffect = effect(() => {
    const anySlotsResponse = this.anySlotsResource.value();
    const unbookedResponse = this.futureUnbookedResource.value();

    if (anySlotsResponse && unbookedResponse) {
      const hasSlots = (anySlotsResponse.totalElements ?? 0) > 0;
      const unbookedCount = unbookedResponse.content?.filter(s => s.isBooked !== true).length ?? 0;

      untracked(() => {
        this.hasAnySlots.set(hasSlots);
        this.globalFutureUnbookedCount.set(unbookedCount);
        this.initialized.set(true);
      });

      this.hasSlotsChange.emit(hasSlots && unbookedCount > 0);
    }
  });

  // Effect: React to global slots resource errors
  private readonly globalSlotsErrorEffect = effect(() => {
    const anySlotsError = this.anySlotsResource.error();
    const unbookedError = this.futureUnbookedResource.error();
    if (anySlotsError != null || unbookedError != null) {
      untracked(() => {
        this.error.set(true);
        this.initialized.set(true);
      });
    }
  });

  // Effect: React to month slots resource results
  private readonly monthSlotsEffect = effect(() => {
    const response = this.monthSlotsResource.value();
    if (response) {
      const allSlots = response.content ?? [];
      const now = Date.now();
      const past = allSlots.filter(s => new Date(this.safeDate(s.startDateTime)).getTime() < now);
      const future = allSlots.filter(s => new Date(this.safeDate(s.startDateTime)).getTime() >= now);

      const currentOffset = this.currentMonthOffset();
      const year = this.monthSlotsParams().year;
      const month = this.monthSlotsParams().month;

      untracked(() => {
        this.pastSlots.set(past);
        this.futureSlots.set(future);

        // Auto-navigate to the first future-slot page for the current month
        const isCurrent = currentOffset === 0 || (year === dayjs().year() && month === dayjs().month() + 1);

        if (isCurrent && future.length > 0) {
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
    }
  });

  // Effect: React to month slots resource errors
  private readonly monthSlotsErrorEffect = effect(() => {
    if (this.monthSlotsResource.error() != null) {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    }
  });

  // Effect: Derive loading state from resources
  private readonly loadingEffect = effect(() => {
    const isLoading = this.anySlotsResource.isLoading() || this.futureUnbookedResource.isLoading() || this.monthSlotsResource.isLoading();
    this.loading.set(isLoading);
  });

  // Effect: Extract location changed template ID from templates resource
  private readonly templateEffect = effect(() => {
    const res = this.templatesResource.value();
    if (res && this.locationChangedTemplateId() === undefined) {
      const template = res.content?.find(t => t.emailType === 'INTERVIEW_LOCATION_CHANGED');
      if (template?.emailTemplateId) {
        this.locationChangedTemplateId.set(template.emailTemplateId);
      }
    }
  });

  private readonly initEffect = effect(() => {
    this.refreshKey(); // track external refresh key
    this.internalRefreshKey(); // track internal refresh key
    const id = this.processId();
    if (id !== '') {
      this.triggerGlobalSlotsRefresh();
      this.triggerMonthSlotsRefresh();
    }
  });

  openCreateSlotsModal(): void {
    this.showSlotCreationForm.set(true);
  }

  refreshSlots(): void {
    this.triggerGlobalSlotsRefresh();
    this.triggerMonthSlotsRefresh();
  }

  onSlotsCreated(): void {
    this.hasAnySlots.set(true);
    this.refreshSlots();
  }

  previousMonth(): void {
    const prevOffset = this.currentMonthOffset() - 1;
    this.currentMonthOffset.set(prevOffset);
    this.currentDatePage.set(0);
    this.triggerMonthSlotsRefresh();
  }

  nextMonth(): void {
    const nextOffset = this.currentMonthOffset() + 1;
    this.currentMonthOffset.set(nextOffset);
    this.currentDatePage.set(0);
    this.triggerMonthSlotsRefresh();
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

  getShowMoreText(count: number): string {
    const key = count === 1 ? 'interview.slots.showMoreSingular' : 'interview.slots.showMorePlural';
    return `${count} ${this.translateService.instant(key)}`;
  }

  onEditSlot(slot: InterviewSlotDTO): void {
    this.selectedSlotForEdit.set(slot);
    this.editLocation.set(slot.location ?? '');
    this.showEditDialog.set(true);
  }

  async saveSlotLocation(): Promise<void> {
    const slot = this.selectedSlotForEdit();
    if (slot?.id === undefined || this.editLocation().trim() === '') return;

    try {
      this.editLoading.set(true);
      await firstValueFrom(this.interviewApi.updateSlotLocation(slot.id, { location: this.editLocation().trim() }));
      this.toastService.showSuccessKey('interview.slots.edit.success');
      this.closeEditDialog();
      this.refreshSlots();
    } catch (error: unknown) {
      const httpError = error as { status?: number };
      if (httpError.status === 403) {
        this.toastService.showErrorKey('interview.slots.edit.errorForbidden');
      } else {
        this.toastService.showErrorKey('interview.slots.edit.error');
      }
    } finally {
      this.editLoading.set(false);
    }
  }

  closeEditDialog(): void {
    this.showEditDialog.set(false);
    this.selectedSlotForEdit.set(undefined);
    this.editLocation.set('');
  }

  async onDeleteSlot(slot: InterviewSlotDTO): Promise<void> {
    const slotId = slot.id;
    if (slotId === undefined) {
      return;
    }

    try {
      // Opt out of global loading to prevent UI flicker, we could add a local loading spinner later if needed
      await firstValueFrom(this.interviewApi.deleteSlot(slotId));
      this.triggerGlobalSlotsRefresh();
      this.triggerMonthSlotsRefresh();

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
    }

    this.triggerGlobalSlotsRefresh();
    this.triggerMonthSlotsRefresh();
    this.slotAssigned.emit();
  }

  onCancelInterview(slot: InterviewSlotDTO): void {
    this.selectedSlotForCancel.set(slot);
    this.showCancelModal.set(true);
  }

  async onCancelInterviewConfirm(cancelParams: CancelInterviewDTO): Promise<void> {
    const slot = this.selectedSlotForCancel();
    if (slot?.id == null) return;

    try {
      await firstValueFrom(this.interviewApi.cancelInterview(this.processId(), slot.id, cancelParams));

      this.triggerGlobalSlotsRefresh();
      this.triggerMonthSlotsRefresh();

      this.toastService.showSuccessKey('interview.slots.cancelInterview.success');

      // Notify parent to refresh interviewee section
      this.slotAssigned.emit();
    } catch {
      this.toastService.showErrorKey('interview.slots.cancelInterview.error');
    } finally {
      this.showCancelModal.set(false);
      this.selectedSlotForCancel.set(undefined);
    }
  }

  /**
   * Triggers a refresh of global slot queries (anySlots + futureUnbooked).
   */
  private triggerGlobalSlotsRefresh(): void {
    this.anySlotsParams.set({ page: 0, size: 1 });
    this.futureUnbookedParams.set({ afterDateTime: new Date().toISOString(), page: 0, size: 1000 });
    this.anySlotsResource.reload();
    this.futureUnbookedResource.reload();
  }

  /**
   * Triggers a refresh of month-specific slots for the calendar view.
   */
  private triggerMonthSlotsRefresh(): void {
    this.error.set(false);
    const target = this.targetDate();
    this.monthSlotsParams.set({ year: target.year(), month: target.month() + 1, page: 0, size: 1000 });
    this.monthSlotsResource.reload();
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
