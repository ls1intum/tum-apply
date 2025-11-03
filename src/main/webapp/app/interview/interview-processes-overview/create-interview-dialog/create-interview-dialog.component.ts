import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { InterviewService } from 'app/interview/service/interview.service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

interface JobForSelection {
  jobId: string;
  title: string;
  startDate: string;
  state: string;
}

@Component({
  selector: 'jhi-create-interview-dialog',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, TranslateModule, ButtonComponent],
  templateUrl: './create-interview-dialog.component.html',
})
export class CreateInterviewDialogComponent implements OnInit {
  readonly ref = inject(DynamicDialogRef);
  readonly config = inject(DynamicDialogConfig);

  private readonly jobService = inject(JobResourceApiService);
  private readonly interviewService = inject(InterviewService);
  private readonly messageService = inject(MessageService);

  readonly jobs = signal<JobForSelection[]>([]);
  readonly selectedJob = signal<JobForSelection | null>(null);
  readonly searchTerm = signal('');
  readonly loading = signal(false);

  readonly filteredJobs = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    return search ? this.jobs().filter(job => job.title.toLowerCase().includes(search)) : this.jobs();
  });

  ngOnInit(): void {
    this.loadPublishedJobs();
  }

  selectJob(job: JobForSelection): void {
    this.selectedJob.set(this.selectedJob()?.jobId === job.jobId ? null : job);
  }

  createInterviewProcess(): void {
    const job = this.selectedJob();
    if (!job) return;

    this.loading.set(true);
    this.interviewService.createInterviewProcess(job.jobId).subscribe({
      next: interviewProcess => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview process created successfully',
        });
        this.ref.close(interviewProcess);
      },
      error: err => {
        console.error('Error creating interview process:', err);
        if (err.status === 409) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Already Exists',
            detail: 'An interview process already exists for this position',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message ?? 'Failed to create interview process',
          });
        }
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.ref.close();
  }

  private loadPublishedJobs(): void {
    this.loading.set(true);
    this.jobService.getJobsByProfessor(100, 0, ['PUBLISHED']).subscribe({
      next: response => {
        const publishedJobs: JobForSelection[] = (response.content || []).map(job => ({
          jobId: job.jobId ?? '',
          title: job.title ?? '',
          startDate: job.startDate ?? '',
          state: job.state ?? '',
        }));
        this.jobs.set(publishedJobs);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading jobs:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load jobs',
        });
        this.loading.set(false);
      },
    });
  }
}
