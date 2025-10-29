import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { InterviewProcessCardComponent} from "app/interview/interview-processes-overview/interview-process-card/ interview-process-card.component";
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';
import { InterviewService, InterviewOverviewDTO } from '../service/interview.service';

@Component({
  selector: 'jhi-interview-processes-overview',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TranslateDirective,
    InterviewProcessCardComponent,
    ButtonComponent,
  ],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent implements OnInit {
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  private readonly interviewService = inject(InterviewService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadInterviewProcesses();
  }

  private loadInterviewProcesses(): void {
    this.loading.set(true);
    this.error.set(null);

    this.interviewService.getInterviewOverview().subscribe({
      next: data => {
        this.interviewProcesses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load interview processes');
        this.loading.set(false);
        // eslint-disable-next-line no-console
        console.error('Error loading interview processes');
      },
    });
  }

  createNewInterviewProcess(): void {
    this.router.navigate(['/interviews/create']);
  }

  viewDetails(jobId: string): void {
    this.router.navigate(['/interviews', jobId]);
  }
}
