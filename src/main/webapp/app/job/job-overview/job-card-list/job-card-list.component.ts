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

import SharedModule from '../../../shared/shared.module';
import { ApplicationStatusExtended, JobCardComponent } from '../job-card/job-card.component';
import { JobCardDTO } from '../../../generated/model/jobCardDTO';
import { JobResourceApiService } from '../../../generated/api/jobResourceApi.service';
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
  pageSize = signal<number>(8);
  searchQuery = signal<string>('');

  sortBy = signal<string>('startDate');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly availableLocationOptions: { key: string; label: string }[] = [
    { key: 'GARCHING', label: 'jobOverviewPage.searchFilterSortBar.locations.garching' },
    { key: 'GARCHING_HOCHBRUECK', label: 'jobOverviewPage.searchFilterSortBar.locations.garching_hochbrueck' },
    { key: 'HEILBRONN', label: 'jobOverviewPage.searchFilterSortBar.locations.heilbronn' },
    { key: 'MUNICH', label: 'jobOverviewPage.searchFilterSortBar.locations.munich' },
    { key: 'STRAUBING', label: 'jobOverviewPage.searchFilterSortBar.locations.straubing' },
    { key: 'WEIHENSTEPHAN', label: 'jobOverviewPage.searchFilterSortBar.locations.weihenstephan' },
    { key: 'SINGAPORE', label: 'jobOverviewPage.searchFilterSortBar.locations.singapore' },
  ];

  readonly selectedJobFilters = signal<string[]>([]);
  readonly selectedFieldOfStudiesFilters = signal<string[]>([]);
  readonly selectedLocationFilters = signal<string[]>([]);
  readonly selectedSupervisorFilters = signal<string[]>([]);

  readonly allJobNames = signal<string[]>([]);
  readonly allFieldofStudies = signal<string[]>([]);
  readonly availableLocationLabels = this.availableLocationOptions.map(option => option.label);
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
    if (filterChange.filterLabel === 'jobOverviewPage.searchFilterSortBar.filterOptions.job') {
      this.page.set(0);
      this.selectedJobFilters.set(filterChange.selectedValues);
      void this.loadJobs();
    } else if (filterChange.filterLabel === 'jobOverviewPage.searchFilterSortBar.filterOptions.fieldOfStudies') {
      this.page.set(0);
      this.selectedFieldOfStudiesFilters.set(filterChange.selectedValues);
      void this.loadJobs();
    } else if (filterChange.filterLabel === 'jobOverviewPage.searchFilterSortBar.filterOptions.location') {
      this.page.set(0);
      const enumValues = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedLocationFilters.set(enumValues);
      void this.loadJobs();
    } else if (filterChange.filterLabel === 'jobOverviewPage.searchFilterSortBar.filterOptions.supervisor') {
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
      const jobNames = await firstValueFrom(this.jobService.getAllAvailableJobNames());
      this.allJobNames.set(jobNames.sort());
      const fieldsOfStudy = await firstValueFrom(this.jobService.getAllFieldOfStudies());
      this.allFieldofStudies.set(fieldsOfStudy.sort());
      const supervisorNames = await firstValueFrom(this.jobService.getAllSupervisorNames());
      this.allSupervisorNames.set(supervisorNames.sort());
    } catch {
      this.allJobNames.set([]);
      this.allFieldofStudies.set([]);
      this.allSupervisorNames.set([]);
      this.toastService.showErrorKey('jobOverviewPage.errors.loadFilter');
    }
  }

  async loadJobs(): Promise<void> {
    try {
      const jobNameFilters = this.selectedJobFilters().length > 0 ? this.selectedJobFilters() : [];
      const fieldsOfStudyFilters = this.selectedFieldOfStudiesFilters().length > 0 ? this.selectedFieldOfStudiesFilters() : [];
      const locationFilters = this.selectedLocationFilters().length > 0 ? this.selectedLocationFilters() : [];
      const supervisorFilters = this.selectedSupervisorFilters().length > 0 ? this.selectedSupervisorFilters() : [];
      const pageData = await firstValueFrom(
        this.jobService.getAvailableJobs(
          this.pageSize(),
          this.page(),
          jobNameFilters.length ? jobNameFilters : undefined,
          fieldsOfStudyFilters.length ? fieldsOfStudyFilters : undefined,
          locationFilters.length ? locationFilters : undefined,
          supervisorFilters.length ? supervisorFilters : undefined,
          this.sortBy(),
          this.sortDirection(),
          this.searchQuery() || undefined,
        ),
      );
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
    }
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): string[] {
    const keyMap = new Map(this.availableLocationOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => keyMap.get(key) ?? key);
  }
}
