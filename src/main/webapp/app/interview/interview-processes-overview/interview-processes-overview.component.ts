import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewProcessCardComponent } from 'app/interview/interview-processes-overview/interview-process-card/interview-process-card.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { UpcomingInterviewDTO } from 'app/generated/model/upcomingInterviewDTO';
import { InterviewResourceApiService } from 'app/generated';
import { firstValueFrom } from 'rxjs';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import dayjs from 'dayjs/esm';

import { UpcomingInterviewCardComponent } from './upcoming-interviews-widget/upcoming-interview-card/upcoming-interview-card.component';

@Component({
  selector: 'jhi-interview-processes-overview',
  imports: [TranslateModule, TranslateDirective, InterviewProcessCardComponent, UpcomingInterviewCardComponent, InfoBoxComponent],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent {
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  upcomingInterviews = signal<UpcomingInterviewDTO[]>([]);

  /**
   * Groups upcoming interviews by Month/Year format for the calendar view.
   * Format: "FEBRUARY 2026"
   */
  groupedUpcomingInterviews = computed(() => {
    const interviews = this.upcomingInterviews();
    if (!interviews.length) return [];

    const grouped = new Map<string, UpcomingInterviewDTO[]>();

    for (const interview of interviews) {
      if (!interview.startDateTime) continue;
      const date = new Date(interview.startDateTime);
      const monthLabel = dayjs(date).format('MMMM YYYY').toUpperCase();
      const list = grouped.get(monthLabel) ?? [];
      list.push(interview);
      grouped.set(monthLabel, list);
    }

    return Array.from(grouped.entries()).map(([month, data]) => ({
      monthLabel: month,
      interviews: data,
    }));
  });

  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly router = inject(Router);

  constructor() {
    void this.loadData();
  }

  createNewInterviewProcess(): void {
    void this.router.navigate(['/interviews/create']);
  }

  viewDetails(jobId: string): void {
    const process = this.interviewProcesses().find(p => p.jobId === jobId);
    if (process?.processId) {
      void this.router.navigate(['/interviews', process.processId], {
        state: { jobTitle: process.jobTitle },
      });
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      const [overviewData, upcomingData] = await Promise.all([
        firstValueFrom(this.interviewService.getInterviewOverview()),
        firstValueFrom(this.interviewService.getUpcomingInterviews()),
      ]);
      const processesWithImages = overviewData.map((process, index) => ({
        ...process,
        imageUrl: process.imageUrl ?? this.getExampleImageUrl(index),
      }));
      this.interviewProcesses.set(processesWithImages);
      this.upcomingInterviews.set(upcomingData);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private getExampleImageUrl(index: number): string {
    const headerImages = [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80',
    ];
    return headerImages[index % headerImages.length];
  }
}
