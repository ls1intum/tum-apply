import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewProcessCardComponent } from 'app/interview/interview-processes-overview/interview-process-card/interview-process-card.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { UpcomingInterviewDTO } from 'app/generated/model/upcomingInterviewDTO';
import { InterviewResourceApiService } from 'app/generated';
import { firstValueFrom } from 'rxjs';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';

import { UpcomingInterviewCardComponent } from './upcoming-interviews-widget/upcoming-interview-card/upcoming-interview-card.component';

@Component({
  selector: 'jhi-interview-processes-overview',
  imports: [TranslateModule, TranslateDirective, InterviewProcessCardComponent, UpcomingInterviewCardComponent, InfoBoxComponent],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent {
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  upcomingInterviews = signal<UpcomingInterviewDTO[]>([]);
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
      this.interviewProcesses.set(overviewData);
      this.upcomingInterviews.set(upcomingData);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
