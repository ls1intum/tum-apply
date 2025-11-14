import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewProcessCardComponent } from 'app/interview/interview-processes-overview/interview-process-card/ interview-process-card.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import {InterviewResourceApiService} from "app/generated";


@Component({
  selector: 'jhi-interview-processes-overview',
  imports: [CommonModule, TranslateModule, TranslateDirective, InterviewProcessCardComponent],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent implements OnInit {
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  private readonly interviewService = inject(InterviewResourceApiService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.loadInterviewProcesses();
  }

  createNewInterviewProcess(): void {
    this.router.navigate(['/interviews/create']);
  }

  viewDetails(jobId: string): void {
    this.router.navigate(['/interviews', jobId]);
  }

  private async loadInterviewProcesses(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(false);
      const data = await this.interviewService.getInterviewOverview().toPromise();
      this.interviewProcesses.set(data ?? []);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
