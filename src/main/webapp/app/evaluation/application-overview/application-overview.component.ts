import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';

import { DynamicTableColumn, DynamicTableComponent } from '../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { Sort } from '../../shared/components/atoms/sorting/sorting';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';
import { EvaluationService } from '../service/evaluation.service';
import { availableStatusOptions, sortableFields } from '../filterSortOptions';
import TranslateDirective from '../../shared/language/translate.directive';
import { ApplicationEvaluationResourceApiService } from '../../generated/api/applicationEvaluationResourceApi.service';
import { ApplicationEvaluationOverviewDTO } from '../../generated/model/applicationEvaluationOverviewDTO';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    DynamicTableComponent,
    TagComponent,
    TranslateModule,
    TranslateDirective,
    SearchFilterSortBar,
  ],
  templateUrl: './application-overview.component.html',
  styleUrls: ['./application-overview.component.scss'],
})
export class ApplicationOverviewComponent {
  pageData = signal<ApplicationEvaluationOverviewDTO[]>([]);
  pageSize = signal(10);
  page = signal(0);
  sortBy = signal<string>('createdAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');
  total = signal(0);
  searchQuery = signal<string>('');

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly selectedJobFilters = signal<string[]>([]);
  readonly selectedStatusFilters = signal<string[]>([]);

  readonly allAvailableJobNames = signal<string[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();
    return [
      { field: 'name', header: 'evaluation.tableHeaders.name', width: '12rem' },
      {
        field: 'state',
        header: 'evaluation.tableHeaders.status',
        width: '10rem',
        alignCenter: true,
        template: stateTpl,
      },
      { field: 'jobName', header: 'evaluation.tableHeaders.job', width: '26rem' },
      // { field: 'rating', header: 'Rating', width: '10rem' },
      { field: 'appliedAt', header: 'evaluation.tableHeaders.appliedAt', type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
  });

  readonly availableStatusLabels = availableStatusOptions.map(option => option.label);

  protected readonly sortableFields = sortableFields;

  private isSearchInitiatedByUser = false;
  private isSortInitiatedByUser = false;

  private readonly evaluationResourceService = inject(ApplicationEvaluationResourceApiService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParamsSignal = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

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

      void this.loadAllJobNames();

      void this.loadPage();
    });
  }

  async loadAllJobNames(): Promise<void> {
    try {
      const jobNames = await firstValueFrom(this.evaluationResourceService.getAllJobNames());
      this.allAvailableJobNames.set(jobNames.sort());
    } catch {
      this.allAvailableJobNames.set([]);
    }
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const newPage = first / rows;
    this.page.set(newPage);
    this.pageSize.set(rows);

    void this.loadPage();
  }

  loadOnSearchEmit(searchQuery: string): void {
    this.isSearchInitiatedByUser = true;
    this.page.set(0);
    this.searchQuery.set(searchQuery);
    void this.loadPage();
  }

  loadOnFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterLabel === 'evaluation.tableHeaders.job') {
      this.page.set(0);
      this.selectedJobFilters.set(filterChange.selectedValues);
      void this.loadPage();
    } else if (filterChange.filterLabel === 'evaluation.tableHeaders.status') {
      this.page.set(0);
      const enumValues = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedStatusFilters.set(enumValues);
      void this.loadPage();
    }
  }

  loadOnSortEmit(event: Sort): void {
    this.isSortInitiatedByUser = true;
    this.page.set(0);

    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);

    void this.loadPage();
  }

  navigateToDetail(application: ApplicationEvaluationOverviewDTO): void {
    const queryParams: Record<string, any> = {
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      applicationId: application.applicationId,
    };

    void this.router.navigate(['/evaluation/application'], {
      queryParams,
    });
  }

  async loadPage(): Promise<void> {
    try {
      const offset = this.pageSize() * this.page();
      const limit = this.pageSize();
      const sortBy = this.sortBy();
      const direction = this.sortDirection();
      const search = this.searchQuery();

      const statusFilters = this.selectedStatusFilters().length > 0 ? this.selectedStatusFilters() : [];
      const jobFilters = this.selectedJobFilters().length > 0 ? this.selectedJobFilters() : [];

      const res = await firstValueFrom(
        this.evaluationResourceService.getApplicationsOverviews(
          offset,
          limit,
          sortBy,
          direction,
          statusFilters.length ? statusFilters : undefined,
          jobFilters.length ? jobFilters : undefined,
          search || undefined,
        ),
      );

      setTimeout(() => {
        this.pageData.set(res.applications ?? []);
        this.total.set(res.totalRecords ?? 0);
      });

      this.updateUrlQueryParams();
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): string[] {
    const keyMap = new Map(availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => keyMap.get(key) ?? key);
  }

  private buildQueryParams(): Params {
    const baseParams: Params = {
      page: this.page(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDir: this.sortDirection(),
    };
    if (this.searchQuery()) {
      baseParams.search = this.searchQuery();
    }
    const filterParams: Params = {};

    return {
      ...baseParams,
      ...filterParams,
    };
  }

  private updateUrlQueryParams(): void {
    const queryParams: Params = this.buildQueryParams();
    void this.router.navigate([], {
      queryParams,
      replaceUrl: true,
    });
  }
}
