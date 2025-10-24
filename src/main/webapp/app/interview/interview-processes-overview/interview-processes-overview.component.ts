import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { InterviewService, InterviewOverviewDTO } from '../service/interview.service';
import TranslateDirective from '../../shared/language/translate.directive';

@Component({
  selector: 'jhi-interview-processes-overview',
  standalone: true,
  imports: [CommonModule, ButtonModule, DividerModule, TranslateModule, TranslateDirective],
  templateUrl: './interview-processes-overview.component.html',
  styleUrls: ['./interview-processes-overview.component.scss'],
})
export class InterviewProcessesOverviewComponent implements OnInit {
  private interviewService = inject(InterviewService);
  private router = inject(Router);

  // Signals
  interviewProcesses = signal<InterviewOverviewDTO[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInterviewProcesses();
  }

  /**
   * Load all interview processes from the backend
   */
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

  /**
   * Navigate to create new interview process
   */
  createNewInterviewProcess(): void {
    // TODO: Implement navigation when create page exists
    console.log('Create new interview process clicked');
  }

  /**
   * Navigate to interview detail/slot management page
   */
  viewDetails(jobId: string): void {
    // TODO: Implement navigation when detail page exists
    this.router.navigate(['/interviews', jobId]);
  }

  /**
   * Calculate width percentage for progress bar segments
   */
  calculateWidth(count: number, total: number): number {
    if (total === 0) return 0;
    return (count / total) * 100;
  }
}
