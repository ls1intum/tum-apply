import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { JobCardDTO } from 'app/generated/model/jobCardDTO';
import { ToastService } from 'app/service/toast-service';
import { Router } from '@angular/router';
import { TranslateDirective } from 'app/shared/language';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-jobs-preview-section',
  standalone: true,
  imports: [CommonModule, ButtonComponent, JobCardComponent, TranslateDirective],
  templateUrl: './jobs-preview-section.component.html',
})
export class JobsPreviewSectionComponent {
  readonly jobService = inject(JobResourceApiService);
  readonly toastService = inject(ToastService);
  readonly router = inject(Router);

  readonly jobs = signal<JobCardDTO[]>([]);
  readonly pageSize = signal<number>(4);

  readonly hasJobs = computed(() => this.jobs().length > 0);

  constructor() {
    void this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    try {
      const jobs = await firstValueFrom(
        this.jobService.getAvailableJobs(this.pageSize(), 0, undefined, undefined, undefined, 'startDate', 'DESC'),
      );
      this.jobs.set(jobs.content ?? []);
    } catch {
      this.jobs.set([]);
      this.toastService.showErrorKey('landingPage.jobsPreview.loadFailed');
    }
  }

  // No fallback images: we only show an image when the job provides one

  goToJobOverview(): void {
    void this.router.navigate(['/job-overview']);
  }
}
