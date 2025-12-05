import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { JobCardDTO } from 'app/generated/model/jobCardDTO';
import { ToastService } from 'app/service/toast-service';
import { Router } from '@angular/router';
import { TranslateDirective } from 'app/shared/language';

@Component({
  selector: 'jhi-jobs-preview-section',
  standalone: true,
  imports: [CommonModule, JobCardComponent, TranslateDirective],
  templateUrl: './jobs-preview-section.component.html',
})
export class JobsPreviewSectionComponent {
  readonly jobService = inject(JobResourceApiService);
  readonly toastService = inject(ToastService);
  readonly router = inject(Router);

  readonly jobs = signal<JobCardDTO[]>([]);
  readonly pageSize = signal<number>(4);
  readonly fallbackImages = [
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80',
  ];

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

  getFallbackImage(index: number): string {
    const images = this.fallbackImages;
    return images[index % images.length];
  }

  goToJobOverview(): void {
    void this.router.navigate(['/job-overview']);
  }
}
