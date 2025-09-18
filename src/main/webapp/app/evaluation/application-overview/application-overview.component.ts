import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { FilterChange, SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';

import { DynamicTableColumn, DynamicTableComponent } from '../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { Sort, SortOption } from '../../shared/components/molecules/sort-bar/sort-bar.component';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';
import { EvaluationService } from '../service/evaluation.service';
import { FilterField } from '../../shared/filter';
import { sortOptions } from '../filterSortOptions';
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
  filters = signal<FilterField[]>([]);
  total = signal(0);
  searchQuery = signal<string>('');

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly selectedJobFilters = signal<string[]>([]);

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

  readonly sortableFields: SortOption[] = [
    { displayName: 'Applied at', field: 'createdAt', type: 'NUMBER' },
    { displayName: 'Name', field: 'applicant.lastName', type: 'TEXT' },
    { displayName: 'Rating', field: 'rating', type: 'NUMBER' },
  ];

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
  });

  protected readonly sortOptions = sortOptions;

  private isSearchInitiatedByUser = false;

  private readonly evaluationResourceService = inject(ApplicationEvaluationResourceApiService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly qpSignal = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  constructor() {
    effect(() => {
      const qp = this.qpSignal();
      const rawPage = qp.get('page');
      this.page.set(rawPage !== null && !isNaN(+rawPage) ? Math.max(0, +rawPage) : 0);

      const rawSize = qp.get('pageSize');
      this.pageSize.set(rawSize !== null && !isNaN(+rawSize) ? Math.max(1, +rawSize) : 10);
      this.sortBy.set(qp.get('sortBy') ?? this.sortableFields[0].field);

      const rawSD = qp.get('sortDir');
      this.sortDirection.set(rawSD === 'ASC' || rawSD === 'DESC' ? rawSD : 'DESC');

      if (!this.isSearchInitiatedByUser) {
        this.searchQuery.set(qp.get('search') ?? '');
      }

      this.isSearchInitiatedByUser = false;

      void this.loadAllJobNames();

      void this.loadPage();
    });
    void this.initFilterFields();
  }

  async initFilterFields(): Promise<void> {
    const filters = await this.evaluationService.getFilterFields();
    const params = this.qpSignal();
    filters.forEach(filter => filter.withSelectionFromParam(params));
    this.filters.set(filters);
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

  loadOnFilterEmit(filters: FilterField[]): void {
    this.page.set(0);
    this.filters.set(filters);

    void this.loadPage();
  }

  loadOnJobFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterLabel === 'evaluation.tableHeaders.job') {
      this.page.set(0);
      this.selectedJobFilters.set(filterChange.selectedValues);
      void this.loadPage();
    }
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);

    this.sortBy.set(event.field ?? this.sortableFields[0].field);
    this.sortDirection.set(event.direction);

    void this.loadPage();
  }

  navigateToDetail(application: ApplicationEvaluationOverviewDTO): void {
    const queryParams: Record<string, any> = {
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      applicationId: application.applicationId,
    };

    this.filters().forEach(filter => {
      if (filter.selected.length > 0) {
        queryParams[filter.field] = filter.selected.map(opt => encodeURIComponent(opt.field)).join(',');
      }
    });

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

      const filtersByKey = this.evaluationService.collectFiltersByKey(this.filters());
      const statusFilters = Array.from(filtersByKey['status'] ?? []);
      const jobFilters = this.selectedJobFilters().length > 0 ? this.selectedJobFilters() : Array.from(filtersByKey.job ?? []);

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
    this.filters().forEach(f => {
      const entry = f.getQueryParamEntry();

      if (entry) {
        filterParams[entry[0]] = entry[1];
      }
    });

    return {
      ...baseParams,
      ...filterParams,
    };
  }

  private updateUrlQueryParams(): void {
    const qp: Params = this.buildQueryParams();
    void this.router.navigate([], {
      queryParams: qp,
      replaceUrl: true,
    });
  }
}
