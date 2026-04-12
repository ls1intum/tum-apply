import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { TableLazyLoadEvent } from 'primeng/table';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { ToastService } from 'app/service/toast-service';

import LocalizedDatePipe from '../../shared/pipes/localized-date.pipe';
import { DynamicTableColumn, DynamicTableComponent } from '../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { Sort } from '../../shared/components/atoms/sorting/sorting';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';
import { UserAvatarComponent } from '../../shared/components/atoms/user-avatar/user-avatar.component';
import { availableStatusOptions, sortableFields } from '../filterSortOptions';
import TranslateDirective from '../../shared/language/translate.directive';
import {
  GetApplicationsOverviewsParams,
  getAllJobNamesResource,
  getApplicationsOverviewsResource,
} from '../../generated/api/application-evaluation-resource-api';
import { ApplicationEvaluationOverviewDTO } from '../../generated/model/application-evaluation-overview-dto';
import { ApplicationEvaluationOverviewListDTO } from '../../generated/model/application-evaluation-overview-list-dto';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [
    RouterModule,
    LocalizedDatePipe,
    ButtonComponent,
    DynamicTableComponent,
    TagComponent,
    TranslateModule,
    TranslateDirective,
    SearchFilterSortBar,
    UserAvatarComponent,
  ],
  templateUrl: './application-overview.component.html',
  styleUrls: ['./application-overview.component.scss'],
})
export class ApplicationOverviewComponent {
  loading = signal(true);
  pageData = signal<ApplicationEvaluationOverviewDTO[]>([]);
  pageSize = signal(10);
  page = signal(0);
  sortBy = signal<string>('createdAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');
  total = signal(0);
  searchQuery = signal<string>('');

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');
  readonly appliedAtTemplate = viewChild.required<TemplateRef<unknown>>('appliedAtTemplate');
  readonly nameTemplate = viewChild.required<TemplateRef<unknown>>('nameTemplate');

  readonly selectedJobFilters = signal<string[]>([]);
  readonly selectedStatusFilters = signal<string[]>([]);
  readonly allAvailableJobNames = signal<string[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();
    const appliedAtTpl = this.appliedAtTemplate();
    const nameTpl = this.nameTemplate();
    return [
      { field: 'name', header: 'evaluation.tableHeaders.name', width: '12rem', template: nameTpl },
      {
        field: 'state',
        header: 'evaluation.tableHeaders.status',
        width: '10rem',
        template: stateTpl,
      },
      { field: 'jobName', header: 'evaluation.tableHeaders.job', width: '26rem' },
      // { field: 'rating', header: 'Rating', width: '10rem' },
      { field: 'appliedAt', header: 'evaluation.tableHeaders.appliedAt', template: appliedAtTpl, width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
    INTERVIEW: 'info',
    JOB_CLOSED: 'info',
  });

  readonly availableStatusLabels = availableStatusOptions.map(option => option.label);

  protected readonly sortableFields = sortableFields;

  private isSearchInitiatedByUser = false;
  private isSortInitiatedByUser = false;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private toastService = inject(ToastService);

  private readonly queryParamsSignal = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  // Resources
  private readonly jobNamesResource = getAllJobNamesResource();

  private readonly overviewsParams = computed<GetApplicationsOverviewsParams>(() => {
    const statusFilters = this.selectedStatusFilters();
    const jobFilters = this.selectedJobFilters();
    const search = this.searchQuery();
    return {
      offset: this.pageSize() * this.page(),
      limit: this.pageSize(),
      sortBy: this.sortBy(),
      direction: this.sortDirection(),
      status: statusFilters.length ? statusFilters : undefined,
      job: jobFilters.length ? jobFilters : undefined,
      search: search || undefined,
    };
  });

  private readonly overviewsResource: HttpResourceRef<ApplicationEvaluationOverviewListDTO | undefined> = getApplicationsOverviewsResource(
    this.overviewsParams,
  );

  private readonly _jobNamesEffect = effect(() => {
    const jobNames = this.jobNamesResource.value();
    if (jobNames !== undefined) {
      this.allAvailableJobNames.set([...jobNames].sort());
    }
    if (this.jobNamesResource.error()) {
      this.allAvailableJobNames.set([]);
      this.toastService.showErrorKey('evaluation.errors.loadJobNames');
    }
  });

  private readonly _overviewsEffect = effect(() => {
    const res = this.overviewsResource.value();
    if (res !== undefined) {
      this.pageData.set(res.applications ?? []);
      this.total.set(res.totalRecords ?? 0);
    }
    if (this.overviewsResource.error()) {
      this.toastService.showErrorKey('evaluation.errors.loadApplications');
    }
    this.loading.set(this.overviewsResource.isLoading());
  });

  constructor() {
    effect(() => {
      const queryParams = this.queryParamsSignal();
      const rawPage = queryParams.get('page');
      this.page.set(rawPage !== null && !isNaN(+rawPage) ? Math.max(0, +rawPage) : 0);

      const rawSize = queryParams.get('pageSize');
      this.pageSize.set(rawSize !== null && !isNaN(+rawSize) ? Math.max(1, +rawSize) : 10);

      if (!this.isSortInitiatedByUser) {
        this.sortBy.set(queryParams.get('sortBy') ?? this.sortableFields[0].fieldName);
        const rawSD = queryParams.get('sortDir');
        this.sortDirection.set(rawSD === 'ASC' || rawSD === 'DESC' ? rawSD : 'DESC');
      } else {
        this.isSortInitiatedByUser = false;
      }

      if (!this.isSearchInitiatedByUser) {
        this.searchQuery.set(queryParams.get('search') ?? '');
      }

      this.isSearchInitiatedByUser = false;
    });
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.page.set(first / rows);
    this.pageSize.set(rows);
    this.updateUrlQueryParams();
  }

  loadOnSearchEmit(searchQuery: string): void {
    this.isSearchInitiatedByUser = true;
    this.page.set(0);
    this.searchQuery.set(searchQuery);
    this.updateUrlQueryParams();
  }

  loadOnFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterId === 'jobTitle') {
      this.page.set(0);
      this.selectedJobFilters.set(filterChange.selectedValues);
    } else if (filterChange.filterId === 'status') {
      this.page.set(0);
      const enumValues = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedStatusFilters.set(enumValues);
    }
    this.updateUrlQueryParams();
  }

  loadOnSortEmit(event: Sort): void {
    this.isSortInitiatedByUser = true;
    this.page.set(0);

    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);

    this.updateUrlQueryParams();
  }

  navigateToDetail(application: ApplicationEvaluationOverviewDTO): void {
    const queryParams: Params = {
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      applicationId: application.applicationId,
    };

    void this.router.navigate(['/evaluation/application'], {
      queryParams,
    });
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): string[] {
    const keyMap = new Map(availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => keyMap.get(key) ?? key);
  }

  private buildQueryParams(): Params {
    const params: Params = {
      page: this.page(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDir: this.sortDirection(),
    };
    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }
    return params;
  }

  private updateUrlQueryParams(): void {
    const queryParams: Params = this.buildQueryParams();
    void this.router.navigate([], {
      queryParams,
      replaceUrl: true,
    });
  }
}
