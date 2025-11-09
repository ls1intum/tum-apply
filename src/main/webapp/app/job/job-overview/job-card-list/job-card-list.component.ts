import { Component, inject, signal } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CommonModule } from '@angular/common';
import { firstValueFrom, map } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { ToastService } from 'app/service/toast-service';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { emptyToUndef } from 'app/core/util/array-util.service';

import SharedModule from '../../../shared/shared.module';
import { ApplicationStatusExtended, JobCardComponent } from '../job-card/job-card.component';
import { JobCardDTO } from '../../../generated/model/jobCardDTO';
import { JobResourceApiService } from '../../../generated/api/jobResourceApi.service';
import * as DropdownOptions from '../.././dropdown-options';

@Component({
  selector: 'jhi-job-card-list',
  standalone: true,
  imports: [CommonModule, TableModule, JobCardComponent, PaginatorModule, SharedModule, SearchFilterSortBar],
  templateUrl: './job-card-list.component.html',
  styleUrls: ['./job-card-list.component.scss'],
})
export class JobCardListComponent {
  ApplicationStatusExtendedLocal = ApplicationStatusExtended;

  jobs = signal<JobCardDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(12);
  searchQuery = signal<string>('');

  sortBy = signal<string>('startDate');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  DropdownOptions = DropdownOptions;

  readonly selectedFieldOfStudiesFilters = signal<string[]>([]);
  readonly selectedLocationFilters = signal<JobFormDTO.LocationEnum[]>([]);
  readonly selectedSupervisorFilters = signal<string[]>([]);

  readonly allFieldOfStudies = signal<string[]>([]);
  readonly availableLocationLabels = this.DropdownOptions.locations.map(option => option.name);
  readonly allSupervisorNames = signal<string[]>([]);

  readonly sortableFields: SortOption[] = [
    { displayName: 'jobOverviewPage.sortingOptions.startDate', fieldName: 'startDate', type: 'NUMBER' },
    { displayName: 'jobOverviewPage.sortingOptions.jobTitle', fieldName: 'title', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.fieldOfStudies', fieldName: 'fieldOfStudies', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.location', fieldName: 'location', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.professor', fieldName: 'professorName', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.workload', fieldName: 'workload', type: 'NUMBER' },
  ];

  translateService = inject(TranslateService);
  currentLanguage = toSignal(this.translateService.onLangChange.pipe(map(event => event.lang.toUpperCase())), {
    initialValue: this.translateService.currentLang ? this.translateService.currentLang.toUpperCase() : 'EN',
  });

  private jobService = inject(JobResourceApiService);
  private readonly toastService = inject(ToastService);

  constructor() {
    void this.loadAllFilter();
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadJobs();
  }

  onSearchEmit(searchQuery: string): void {
    const normalizedQuery = searchQuery.trim().replace(/\s+/g, ' ');
    const currentQuery = this.searchQuery().trim().replace(/\s+/g, ' ');

    if (normalizedQuery !== currentQuery) {
      this.page.set(0);
      this.searchQuery.set(normalizedQuery);
      void this.loadJobs();
    }
  }

  onFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterId === 'fieldOfStudies') {
      this.page.set(0);
      this.selectedFieldOfStudiesFilters.set(filterChange.selectedValues);
      void this.loadJobs();
    } else if (filterChange.filterId === 'location') {
      this.page.set(0);
      const enumValues = DropdownOptions.mapLocationNames(filterChange.selectedValues);
      this.selectedLocationFilters.set(enumValues);
      void this.loadJobs();
    } else if (filterChange.filterId === 'supervisor') {
      this.page.set(0);
      this.selectedSupervisorFilters.set(filterChange.selectedValues);
      void this.loadJobs();
    }
  }

  onSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);
    void this.loadJobs();
  }

  async loadAllFilter(): Promise<void> {
    try {
      const filterOptions = await firstValueFrom(this.jobService.getAllFilters());
      this.allFieldOfStudies.set(filterOptions.fieldsOfStudy ?? []);
      this.allSupervisorNames.set(filterOptions.supervisorNames ?? []);
    } catch {
      this.allFieldOfStudies.set([]);
      this.allSupervisorNames.set([]);
      this.toastService.showErrorKey('jobOverviewPage.errors.loadFilter');
    }
  }

  async loadJobs(): Promise<void> {
    try {
      const pageData = await firstValueFrom(
        this.jobService.getAvailableJobs(
          this.pageSize(),
          this.page(),
          emptyToUndef(this.selectedFieldOfStudiesFilters()),
          emptyToUndef(this.selectedLocationFilters()),
          emptyToUndef(this.selectedSupervisorFilters()),
          this.sortBy(),
          this.sortDirection(),
          this.searchQuery() || undefined,
        ),
      );
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
      this.toastService.showErrorKey('jobOverviewPage.errors.loadJobs');
    }
  }

  /**
   * Returns a randomly selected header image URL from a pool of 4 images
   * Replace with actual image urls when available
   */
  getExampleImageUrl(index: number): string {
    const headerImages = [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
      'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80',
    ];

    return headerImages[index % headerImages.length];
  }
}
