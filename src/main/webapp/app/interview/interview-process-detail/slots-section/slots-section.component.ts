import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
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

import { MonthNavigationComponent } from './month-navigation/month-navigation.component';
import { DateHeaderComponent } from './date-header/date-header.component';
import { SlotCardComponent } from './slot-card/slot-card.component';

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
    FontAwesomeModule,
  ],
  templateUrl: './slots-section.component.html',
})
export class SlotsSectionComponent {
  // Inputs
  processId = input.required<string>();

  // Signals
  slots = signal<InterviewSlotDTO[]>([]);
  loading = signal(true);
  error = signal(false);
  currentMonthOffset = signal(0); // 0 = current month, -1 = previous month, +1 = next month
  currentDatePage = signal(0); // Pagination within the current month
  expandedDates = signal<Set<string>>(new Set()); // Tracks which date groups are expanded

  // Computed properties (must be before private fields for lint)
  /**
   * Groups slots by date and sorts them chronologically
   */
  groupedSlots = computed<GroupedSlots[]>(() => {
    const slotsData = this.slots();
    if (!slotsData.length) return [];

    const grouped = new Map<string, InterviewSlotDTO[]>();

    slotsData.forEach(slot => {
      const localDate = new Date(slot.startDateTime!);
      const dateKey = localDate.toISOString().split('T')[0];

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(slot);
    });

    return Array.from(grouped.entries())
      .map(([dateKey, dateSlots]) => ({
        date: dateKey,
        localDate: new Date(dateKey),
        slots: dateSlots.sort((a, b) => new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime()),
      }))
      .sort((a, b) => a.localDate.getTime() - b.localDate.getTime());
  });

  /**
   * Filters grouped slots to only show the current selected month
   */
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

  /**
   * Paginates the current month's slots to show max 5 dates at a time
   */
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

  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  private readonly MAX_VISIBLE_SLOTS = 3;
  private readonly DATES_PER_PAGE = 5;

  // Convert language change observable to signal
  private readonly langChangeSignal = toSignal(this.translateService.onLangChange);

  // Writable signal for current language
  private readonly currentLangSignal = signal(this.translateService.currentLang || this.translateService.defaultLang || 'en');

  // Locale computed from current language signal
  private locale = computed(() => {
    const lang = this.currentLangSignal();
    return lang === 'de' ? 'de-DE' : 'en-US';
  });

  // Effect to update current language when language changes
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

  openCreateSlotsModal(): void {
    // TODO: Open Create Slots Modal
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id) {
      await this.loadSlots(id);
    }
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

  /**
   * Returns properly pluralized "show more" text based on count
   */
  getShowMoreText(count: number): string {
    const key = count === 1 ? 'interview.slots.showMoreSingular' : 'interview.slots.showMorePlural';
    return `${count} ${this.translateService.instant(key)}`;
  }

  onEditSlot(): void {
    // TODO: Open Edit Modal
  }

  onDeleteSlot(): void {
    // TODO: Open Delete Confirmation
  }

  onAssignApplicant(): void {
    // TODO: Open Assign Modal
  }

  private async loadSlots(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);

      const data = await firstValueFrom(this.interviewService.getSlotsByProcessId(processId));

      this.slots.set(data);
    } catch (error) {
      this.toastService.showErrorKey('interview.slots.error.loadFailed');
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
