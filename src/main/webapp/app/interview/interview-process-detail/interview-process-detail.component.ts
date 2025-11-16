import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CarouselModule } from 'primeng/carousel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { InterviewResourceApiService } from 'app/generated';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { DateColumnComponent } from './date-column/date-column.component';

interface GroupedSlots {
  date: string;
  localDate: Date;
  slots: InterviewSlotDTO[];
}

@Component({
  selector: 'jhi-interview-process-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonComponent,
    CarouselModule,
    ProgressSpinnerModule,
    DateColumnComponent,
  ],
  templateUrl: './interview-process-detail.component.html',
})
export class InterviewProcessDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interviewService = inject(InterviewResourceApiService);

  processId = signal<string | null>(null);
  jobTitle = signal<string>('');
  slots = signal<InterviewSlotDTO[]>([]);
  loading = signal(true);
  error = signal(false);

  currentMonthOffset = signal(0);

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

  filteredSlots = computed(() => {
    const groups = this.groupedSlots();
    const offset = this.currentMonthOffset();

    if (offset === 0) return groups;

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + offset);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    return groups.filter(group => {
      return group.localDate.getMonth() === targetMonth &&
        group.localDate.getFullYear() === targetYear;
    });
  });

  currentMonth = computed(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + this.currentMonthOffset());

    return targetDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  responsiveOptions = [
    { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1200px', numVisible: 3, numScroll: 1 },
    { breakpoint: '768px', numVisible: 2, numScroll: 1 },
    { breakpoint: '576px', numVisible: 1, numScroll: 1 },
  ];

  constructor() {
    const id = this.route.snapshot.paramMap.get('processId');
    if (id) {
      this.processId.set(id);
      void this.loadData(id);
    }
  }

  private async loadData(processId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);

      const slotsData = await firstValueFrom(
        this.interviewService.getSlotsByProcessId(processId)
      );
      this.slots.set(slotsData);

      const overviewData = await firstValueFrom(
        this.interviewService.getInterviewOverview()
      );
      const process = overviewData.find(p => p.processId === processId);
      if (process) {
        this.jobTitle.set(process.jobTitle || 'Interview Slots');
      }
    } catch (error) {
      console.error('Failed to load interview data', error);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/interviews']);
  }

  openCreateSlotsModal(): void {
    console.log('Create slots modal - Issue #8');
  }

  async refreshSlots(): Promise<void> {
    const id = this.processId();
    if (id) {
      await this.loadData(id);
    }
  }

  previousMonth(): void {
    this.currentMonthOffset.update(v => v - 1);
  }

  nextMonth(): void {
    this.currentMonthOffset.update(v => v + 1);
  }

  canGoPrevious = computed(() => true);
  canGoNext = computed(() => true);
}
