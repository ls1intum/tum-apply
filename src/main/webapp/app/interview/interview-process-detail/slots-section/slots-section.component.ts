import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ToastService } from 'app/service/toast-service';
import TranslateDirective from 'app/shared/language/translate.directive';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { SlotCreationFormComponent } from 'app/interview/interview-process-detail/slots-section/slot-creation-form/slot-creation-form.component';

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
    CommonModule,
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

  // Outputs
  slotAssigned = output();

  // Signals
  slots = signal<InterviewSlotDTO[]>([]);
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

  // Computed properties
  groupedSlots = computed<GroupedSlots[]>(() => {
    const slotsData = this.slots();
    if (!slotsData.length) return [];

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

  currentMonth = computed(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + this.currentMonthOffset());
    return targetDate.toLocaleDateString(this.locale(), {
      month: 'long',
      year: 'numeric',
    });
  });

  totalDatePages = computed(() => {
    return Math.ceil(this.currentMonthSlots().length / this.DATES_PER_PAGE);
  });

  canGoPreviousDate = computed(() => this.currentDatePage() > 0);

  canGoNextDate = computed(() => this.currentDatePage() < this.totalDatePages() - 1);

  // Services
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  // Constants
  private readonly MAX_VISIBLE_SLOTS = 3;
  private readonly DATES_PER_PAGE = 5;

  // Internal Signals
  private readonly langChangeSignal = toSignal(this.translateService.onLangChange);
  private readonly currentLangSignal = signal(this.translateService.getBrowserCultureLang() ?? 'en');

  private locale = computed(() => {
    const lang = this.currentLangSignal();
    return lang === 'de' ? 'de-DE' : 'en-US';
  });

  // Effects
  private readonly langChangeEffect = effect(() => {
    const langEvent = this.langChangeSignal();
    if (langEvent?.lang) {
      this.currentLangSignal.set(langEvent.lang);
    }
  });

  private readonly loadSlotsEffect = effect(() => {
    const id = this.processId();
    if (id) {
      void this.loadSlots(id);
    }
  });

  private readonly checkGlobalSlotsEffect = effect(() => {
    void this.checkGlobalSlots();
  });

  // Methods
  openCreateSlotsModal(): void {
    this.showSlotCreationForm.set(true);
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id) {
      await this.loadSlots(id);
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
    if (!slotId) {
      return;
    }

    try {
      this.loading.set(true);

      await firstValueFrom(this.interviewService.deleteSlot(slotId));
      await this.loadSlots(this.processId());

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

  private async checkGlobalSlots(): Promise<void> {
    try {
      // Check if any slots exist globally
      const response = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(this.processId())
      );
      this.hasAnySlots.set(response.totalElements > 0);
    } catch {
      // Ignore errors
    }
  }

  private async loadSlots(processId: string): Promise<void> {
    const isFirstLoad = this.hasAnySlots() === undefined;

    try {
      if (isFirstLoad) {
        this.loading.set(true);
      }
      this.error.set(false);

      // Load all slots (backend defaults to page 0, size 20 - we can pass params if needed)
      const response = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId)
      );

      this.slots.set(response.content ?? []);
      if (this.hasAnySlots() === undefined) {
        this.hasAnySlots.set(response.totalElements > 0);
      }
    } catch {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private safeDate(value?: string): number {
    return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
  }
}
