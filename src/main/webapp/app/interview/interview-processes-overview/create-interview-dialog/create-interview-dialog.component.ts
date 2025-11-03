import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { InterviewService } from 'app/interview/service/interview.service';
import { MessageService } from 'primeng/api';
import { CreatedJobDTO } from 'app/generated/model/createdJobDTO';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import TranslateDirective from 'app/shared/language/translate.directive';

interface JobForSelection {
  jobId: string;
  title: string;
  startDate: string;
  state: string;
}

@Component({
  selector: 'app-create-interview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    FormsModule,
    TranslateModule,
    TranslateDirective,
    ButtonComponent
  ],
  templateUrl: './create-interview-dialog.component.html'
})
export class CreateInterviewDialogComponent implements OnInit {
  private readonly jobService = inject(JobResourceApiService);
  private readonly interviewService = inject(InterviewService);
  private readonly messageService = inject(MessageService);
  readonly ref = inject(DynamicDialogRef);
  readonly config = inject(DynamicDialogConfig);

  readonly jobs = signal<JobForSelection[]>([]);
  readonly selectedJob = signal<JobForSelection | null>(null);
  readonly searchTerm = signal<string>('');
  readonly loading = signal<boolean>(false);

  readonly filteredJobs = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) {
      return this.jobs();
    }
    return this.jobs().filter(job =>
      job.title.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.loadPublishedJobs();
  }

  loadPublishedJobs(): void {
    this.loading.set(true);

    this.jobService.getJobsByProfessor(
      100,
      0,
      ['PUBLISHED']
    ).subscribe({
      next: (response) => {
        const publishedJobs = (response.content || []).map(job => ({
          jobId: job.jobId!,
          title: job.title!,
          startDate: job.startDate!,
          state: job.state!
        }));
        this.jobs.set(publishedJobs);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load jobs'
        });
        this.loading.set(false);
      }
    });
  }

  selectJob(job: JobForSelection): void {
    if (this.selectedJob()?.jobId === job.jobId) {
      this.selectedJob.set(null);
    } else {
      this.selectedJob.set(job);
    }
  }

  createInterviewProcess(): void {
    const job = this.selectedJob();
    if (!job) {
      return;
    }

    this.loading.set(true);
    this.interviewService.createInterviewProcess(job.jobId).subscribe({
      next: (interviewProcess) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Interview process created successfully'
        });
        this.ref.close(interviewProcess);
      },
      error: (error) => {
        console.error('Error creating interview process:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create interview process'
        });
        this.loading.set(false);
      }
    });
  }

  cancel(): void {
    this.ref.close();
  }

}
