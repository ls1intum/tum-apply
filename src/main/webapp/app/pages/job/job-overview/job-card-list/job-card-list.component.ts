import { Component, OnInit, signal, inject } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { JobCardComponent } from '../job-card/job-card.component';
import { JobCardDTO, JobResourceService, PageJobCardDTO } from 'app/generated';

@Component({
  selector: 'jhi-job-card-list',
  standalone: true,
  imports: [CommonModule, TableModule, JobCardComponent],
  templateUrl: './job-card-list.component.html',
  styleUrls: ['./job-card-list.component.scss'],
})
export class JobCardListComponent implements OnInit {
  jobs = signal<JobCardDTO[]>([]);
  loading = signal<boolean>(false);
  totalRecords = signal<number>(0);
  pageSize = 8;

  private jobService = inject(JobResourceService);

  ngOnInit(): void {
    // Trigger the first load manually
    this.onLazyLoad({ first: 0, rows: this.pageSize });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize));
    const size = event.rows ?? this.pageSize;
    this.loadJobs(page, size);
  }

  private loadJobs(page: number, size: number): void {
    this.loading.set(true);

    this.jobService.getAvailableJobs(page, size).subscribe({
      next: (pageData: PageJobCardDTO) => {
        this.jobs.set(pageData.content || []);
        this.totalRecords.set(pageData.totalElements ?? 0);
        this.loading.set(false);
      },
      error: err => {
        console.error('Failed to load jobs from API:', err);
        this.loading.set(false);
      },
    });
  }

  trackByJobId(index: number, job: JobCardDTO): string {
    return job.jobId ?? index.toString();
  }
}
