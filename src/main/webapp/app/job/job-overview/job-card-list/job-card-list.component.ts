import { Component, inject, signal } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CommonModule } from '@angular/common';
import { JobCardDTO, JobResourceService } from 'app/generated';
import { firstValueFrom } from 'rxjs';

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
  page = signal<number>(0);
  pageSize = signal<number>(8);

  private jobService = inject(JobResourceService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    try {
      const pageData = await firstValueFrom(this.jobService.getAvailableJobs(this.pageSize(), this.page()));
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
    }
  }
}
