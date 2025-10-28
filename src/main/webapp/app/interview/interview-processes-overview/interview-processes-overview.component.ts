import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewService, InterviewOverviewDTO } from '../service/interview.service';
import TranslateDirective from '../../shared/language/translate.directive';
import { InterviewProcessCardComponent} from "app/interview/interview-processes-overview/interview-process-card/ interview-process-card.component";
import { ButtonComponent } from '../../shared/components/atoms/button/button.component'; // ← NEU!

@Component({
  selector: 'jhi-interview-processes-overview',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TranslateDirective,
    InterviewProcessCardComponent,
    ButtonComponent, // ← NEU!
  ],
  templateUrl: './interview-processes-overview.component.html',
})
export class InterviewProcessesOverviewComponent implements OnInit {
  private interviewService = inject(InterviewService);
  private router = inject(Router);

  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInterviewProcesses();
  }

  loadInterviewProcesses(): void {
    this.loading.set(true);
    this.error.set(null);

    this.interviewService.getInterviewOverview().subscribe({
      next: data => {
        this.interviewProcesses.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Failed to load interview processes');
        this.loading.set(false);
        console.error('Error loading interview processes:', err);
      },
    });
  }

  createNewInterviewProcess(): void {
    console.log('Create new interview process clicked');
  }

  viewDetails(jobId: string): void {
    this.router.navigate(['/interviews', jobId]);
  }
}
