import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
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
  ],
  templateUrl: './slots-section.component.html',
})
export class SlotsSectionComponent {
  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly translateService = inject(TranslateService);

  // Input vom Parent Component
  processId = input.required<string>();

  readonly MAX_VISIBLE_SLOTS = 3;
  private readonly DATES_PER_PAGE = 5;

  slots = signal<InterviewSlotDTO[]>([]);
  loading = signal(true);
  error = signal(false);
  currentMonthOffset = signal(0);
  currentDatePage = signal(0);
  expandedDates = signal<Set<string>>(new Set());

  private locale = computed(() => {
    const currentLang = this.translateService.currentLang || 'en';
    return currentLang === 'de' ? 'de-DE' : 'en-US';
  });

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
        slots: dateSlots.sort((a, b) =>
          new Date(a.startDateTime!).getTime() - new Date(b.startDateTime!).getTime()
        ),
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
      return group.localDate.getMonth() === targetMonth &&
        group.localDate.getFullYear() === targetYear;
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

  constructor() {
    // Effect um Slots zu laden wenn processId sich ändert
    effect(() => {
      const id = this.processId();
      if (id) {
        void this.loadSlots(id);
      }
    });
  }

  private async loadSlots(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);

      const data = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId)
      );

      this.slots.set(data);
    } catch (error) {
      console.error('Failed to load interview slots', error);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  openCreateSlotsModal(): void {
    console.log('Create slots modal - Issue #8');
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id) {
      await this.loadSlots(id);
    }
  }

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
      this.currentDatePage.update(p => p - 1);
    }
  }

  nextDatePage(): void {
    if (this.canGoNextDate()) {
      this.currentDatePage.update(p => p + 1);
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

  onEditSlot(slot: InterviewSlotDTO): void {
    console.log('Edit slot:', slot);
    // TODO: Open Edit Modal
  }

  onDeleteSlot(slot: InterviewSlotDTO): void {
    console.log('Delete slot:', slot);
    // TODO: Open Delete Confirmation
  }

  onAssignApplicant(slot: InterviewSlotDTO): void {
    console.log('Assign applicant to slot:', slot);
    // TODO: Open Assign Modal
  }
}
