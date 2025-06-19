import { Component, inject, signal } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CommonModule } from '@angular/common';
import { JobCardDTO, JobResourceService } from 'app/generated';
import { firstValueFrom } from 'rxjs';

import { JobCardComponent } from '../job-card/job-card.component';
import { Sort, SortBarComponent, SortOption } from '../../../shared/components/molecules/sort-bar/sort-bar.component';

@Component({
  selector: 'jhi-job-card-list',
  standalone: true,
  imports: [CommonModule, TableModule, JobCardComponent, PaginatorModule, SortBarComponent],
  templateUrl: './job-card-list.component.html',
  styleUrls: ['./job-card-list.component.scss'],
})
export class JobCardListComponent {
  jobs = signal<JobCardDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(8);

  sortBy = signal<string>('startDate');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly sortableFields: SortOption[] = [
    { displayName: 'Job Title', field: 'title', type: 'TEXT' },
    { displayName: 'Field of Studies', field: 'fieldOfStudies', type: 'TEXT' },
    { displayName: 'Location', field: 'location', type: 'TEXT' },
    { displayName: 'Professor', field: 'professor', type: 'TEXT' },
    { displayName: 'Workload', field: 'workload', type: 'NUMBER' },
    { displayName: 'Start Date', field: 'startDate', type: 'NUMBER' },
  ];

  private jobService = inject(JobResourceService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadJobs();
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field ?? this.sortableFields[0].field);
    this.sortDirection.set(event.direction);
    void this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    try {
      const pageData = await firstValueFrom(
        this.jobService.getAvailableJobs(this.pageSize(), this.page(), undefined, this.sortBy(), this.sortDirection()),
      );
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
    }
  }
}
