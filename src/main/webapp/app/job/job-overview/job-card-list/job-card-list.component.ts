import { Component, effect, inject, signal } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CommonModule } from '@angular/common';
import { JobCardDTO, JobResourceService, PageJobCardDTO } from 'app/generated';

import { JobCardComponent } from '../job-card/job-card.component';

@Component({
  selector: 'jhi-job-card-list',
  standalone: true,
  imports: [CommonModule, TableModule, JobCardComponent, PaginatorModule],
  templateUrl: './job-card-list.component.html',
  styleUrls: ['./job-card-list.component.scss'],
})
export class JobCardListComponent {
  jobs = signal<JobCardDTO[]>([]);
  totalRecords = signal<number>(0);
  pageSize = signal<number>(8);

  private jobService = inject(JobResourceService);

  constructor() {
    // Trigger the first load of the job list
    effect(() => {
      this.onLazyLoad({ first: 0, rows: this.pageSize() });
    });
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();
    this.loadJobs(page, size);
  }

  private loadJobs(page: number, size: number): void {
    this.jobService.getAvailableJobs(size, page).subscribe({
      next: (pageData: PageJobCardDTO) => {
        this.jobs.set(pageData.content ?? []);
        this.totalRecords.set(pageData.totalElements ?? 0);
      },
      error(err) {
        console.error('Failed to load jobs from API:', err);
      },
    });
  }
}
