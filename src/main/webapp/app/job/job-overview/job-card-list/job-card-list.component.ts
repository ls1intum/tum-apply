import { Component, Signal, computed, effect, inject, signal } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { ToastService } from 'app/service/toast-service';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { emptyToUndef } from 'app/core/util/array-util.service';
import { TranslateDirective } from 'app/shared/language';
import { AccountService } from 'app/core/auth/account.service';
import { JobFormDTOLocationEnum, JobFormDTOSubjectAreaEnum } from 'app/generated/model/job-form-dto';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { GetAvailableJobsParams, getAllFiltersResource, getAvailableJobsResource } from 'app/generated/api/job-resource-api';
import { JobFiltersDTO } from 'app/generated/model/job-filters-dto';
import { PageJobCardDTO } from 'app/generated/model/page-job-card-dto';

import { ApplicationStatusExtended, JobCardComponent } from '../job-card/job-card.component';
import { JobCardDTO } from '../../../generated/model/job-card-dto';
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

  readonly accountService = inject(AccountService);
  readonly selectedSubjectAreaFilters = signal<JobFormDTOSubjectAreaEnum[]>([]);
  readonly selectedLocationFilters = signal<JobFormDTOLocationEnum[]>([]);
  readonly selectedSupervisorFilters = signal<string[]>([]);
  readonly notificationsSettingsHref: Signal<string>;

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
  readonly notificationsCtaTranslateValues = computed(() => {
    // Recompute the translated link text when the active language changes.
    this.currentLanguage();
    return {
      link: `<a class="font-medium text-primary hover:underline" href="${this.notificationsSettingsHref()}">${this.translateService.instant('jobOverviewPage.notificationsCta.link')}</a>`,
    };
  });
  readonly canManageSubjectAreaSubscriptions = computed(
    () => this.accountService.signedIn() && this.accountService.hasAnyAuthority([UserShortDTORolesEnum.Applicant]),
  );

  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly filtersResource: HttpResourceRef<JobFiltersDTO | undefined> = getAllFiltersResource();

  private readonly availableJobsParams = computed<GetAvailableJobsParams>(() => ({
    pageSize: this.pageSize(),
    pageNumber: this.page(),
    subjectAreas: emptyToUndef(this.selectedSubjectAreaFilters()),
    locations: emptyToUndef(this.selectedLocationFilters()),
    professorNames: emptyToUndef(this.selectedSupervisorFilters()),
    sortBy: this.sortBy(),
    direction: this.sortDirection(),
    searchQuery: this.searchQuery() || undefined,
  }));

  private readonly availableJobsResource: HttpResourceRef<PageJobCardDTO | undefined> = getAvailableJobsResource(this.availableJobsParams);

  private readonly syncFiltersEffect = effect(() => {
    const filters = this.filtersResource.value();
    if (filters) {
      this.allSupervisorNames.set(filters.supervisorNames ?? []);
    }
    if (this.filtersResource.error()) {
      this.allSupervisorNames.set([]);
      this.toastService.showErrorKey('jobOverviewPage.errors.loadFilter');
    }
  });

  private readonly syncJobsEffect = effect(() => {
    const pageData = this.availableJobsResource.value();
    if (pageData) {
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    }
    if (this.availableJobsResource.error()) {
      console.error('Failed to load jobs from API:', this.availableJobsResource.error());
      this.toastService.showErrorKey('jobOverviewPage.errors.loadJobs');
    }
  });

  constructor() {
    this.notificationsSettingsHref = computed(() =>
      this.router.serializeUrl(this.router.createUrlTree(['/settings'], { queryParams: { tab: 'notifications' } })),
    );
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
