import { Component, effect, inject, signal } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { firstValueFrom, map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { ToastService } from 'app/service/toast-service';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { emptyToUndef } from 'app/core/util/array-util.service';
import { TranslateDirective } from 'app/shared/language';
import { JobFormDTOLocationEnum, JobFormDTOSubjectAreaEnum } from 'app/generated/model/job-form-dto';

import { ApplicationStatusExtended, JobCardComponent } from '../job-card/job-card.component';
import { JobCardDTO } from '../../../generated/model/job-card-dto';
import { JobResourceApi } from '../../../generated/api/job-resource-api';
import * as DropdownOptions from '../.././dropdown-options';

@Component({
  selector: 'jhi-job-card-list',
  standalone: true,
  imports: [TableModule, JobCardComponent, PaginatorModule, SearchFilterSortBar, TranslateModule, TranslateDirective],
  templateUrl: './job-card-list.component.html',
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

  readonly selectedSubjectAreaFilters = signal<JobFormDTOSubjectAreaEnum[]>([]);
  readonly selectedLocationFilters = signal<JobFormDTOLocationEnum[]>([]);
  readonly selectedSupervisorFilters = signal<string[]>([]);

  readonly allSubjectAreas = this.DropdownOptions.subjectAreas.map(option => option.name);
  readonly availableLocationLabels = this.DropdownOptions.locations.map(option => option.name);
  readonly allSupervisorNames = signal<string[]>([]);

  readonly sortableFields: SortOption[] = [
    { displayName: 'jobOverviewPage.sortingOptions.startDate', fieldName: 'startDate', type: 'NUMBER' },
    { displayName: 'jobOverviewPage.sortingOptions.jobTitle', fieldName: 'title', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.subjectArea', fieldName: 'subjectArea', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.location', fieldName: 'location', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.professor', fieldName: 'professorName', type: 'TEXT' },
    { displayName: 'jobOverviewPage.sortingOptions.workload', fieldName: 'workload', type: 'NUMBER' },
  ];

  translateService = inject(TranslateService);
  currentLanguage = toSignal(this.translateService.onLangChange.pipe(map(event => event.lang.toUpperCase())), {
    initialValue: this.translateService.getCurrentLang() ? this.translateService.getCurrentLang().toUpperCase() : 'EN',
  });

  private jobApi = inject(JobResourceApi);
  private readonly toastService = inject(ToastService);

  private readonly loadJobsEffect = effect(() => {
    this.page();
    this.pageSize();
    this.searchQuery();
    this.selectedSubjectAreaFilters();
    this.selectedLocationFilters();
    this.selectedSupervisorFilters();
    this.sortBy();
    this.sortDirection();
    void this.loadJobs();
  });

  constructor() {
    void this.loadAllFilter();
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
  }

  onSearchEmit(searchQuery: string): void {
    const normalizedQuery = searchQuery.trim().replace(/\s+/g, ' ');
    const currentQuery = this.searchQuery().trim().replace(/\s+/g, ' ');

    if (normalizedQuery !== currentQuery) {
      this.page.set(0);
      this.searchQuery.set(normalizedQuery);
    }
  }

  onFilterEmit(filterChange: FilterChange): void {
    this.page.set(0);
    if (filterChange.filterId === 'subjectArea') {
      this.selectedSubjectAreaFilters.set(DropdownOptions.mapSubjectAreaNames(filterChange.selectedValues));
    } else if (filterChange.filterId === 'location') {
      const enumValues = DropdownOptions.mapLocationNames(filterChange.selectedValues);
      this.selectedLocationFilters.set(enumValues);
    } else if (filterChange.filterId === 'supervisor') {
      this.selectedSupervisorFilters.set(filterChange.selectedValues);
    } else {
      return;
    }
  }

  onSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);
  }

  async loadAllFilter(): Promise<void> {
    try {
      const filterOptions = await firstValueFrom(this.jobApi.getAllFilters());
      this.allSupervisorNames.set(filterOptions.supervisorNames ?? []);
    } catch {
      this.allSupervisorNames.set([]);
      this.toastService.showErrorKey('jobOverviewPage.errors.loadFilter');
    }
  }

  async loadJobs(): Promise<void> {
    try {
      const pageData = await firstValueFrom(
        this.jobApi.getAvailableJobs(
          this.pageSize(),
          this.page(),
          emptyToUndef(this.selectedSubjectAreaFilters()),
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

  getExampleImageUrl(index: number): string {
    const headerImages = [
      '/content/images/job-banner/job-banner1.jpg',
      '/content/images/job-banner/job-banner2.jpg',
      '/content/images/job-banner/job-banner3.jpg',
      '/content/images/job-banner/job-banner4.jpg',
      '/content/images/job-banner/job-banner5.jpg',
      '/content/images/job-banner/job-banner6.jpg',
    ];

    return headerImages[index % headerImages.length];
  }
}
