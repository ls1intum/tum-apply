import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { DynamicTableColumn, DynamicTableComponent } from '../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../generated';
import { Sort, SortOption } from '../../shared/components/molecules/sort-bar/sort-bar.component';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';
import { FilterField, FilterSortBarComponent } from '../../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';
import { sortOptions } from '../filterSortOptions';
import { EvaluationService } from '../service/evaluation.service';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, DynamicTableComponent, TagComponent, FilterSortBarComponent],
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

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();
    return [
      { field: 'name', header: 'Name', width: '12rem' },
      {
        field: 'state',
        header: 'Status',
        width: '10rem',
        alignCenter: true,
        template: stateTpl,
      },
      { field: 'jobName', header: 'Job', width: '26rem' },
      { field: 'rating', header: 'Rating', width: '10rem' },
      { field: 'appliedAt', header: 'Applied at', type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly sortableFields: SortOption[] = [
    { displayName: 'Applied at', field: 'createdAt', type: 'NUMBER' },
    { displayName: 'Name', field: 'applicant.lastName', type: 'TEXT' },
    { displayName: 'Rating', field: 'rating', type: 'NUMBER' },
  ];

  readonly stateTextMap = signal<Record<string, string>>({
    SENT: 'Unopened',
    ACCEPTED: 'Approved',
    REJECTED: 'Rejected',
    IN_REVIEW: 'In Review',
  });
  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    SENT: 'info',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    IN_REVIEW: 'warn',
  });

  protected filterFields: FilterField[] = [];
  protected readonly sortOptions = sortOptions;

  private readonly evaluationResourceService = inject(ApplicationEvaluationResourceService);
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

      void this.loadPage();
    });
    void this.initFilterFields();
  }

  async initFilterFields(): Promise<void> {
    this.filterFields = await this.evaluationService.getFilterFields();
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const newPage = first / rows;
    this.page.set(newPage);
    this.pageSize.set(rows);

    this.updateUrlQueryParams();

    void this.loadPage();
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);

    this.sortBy.set(event.field ?? this.sortableFields[0].field);
    this.sortDirection.set(event.direction);

    this.updateUrlQueryParams();

    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.evaluationResourceService.getApplicationsOverviews(
          this.pageSize() * this.page(),
          this.pageSize(),
          this.sortBy(),
          this.sortDirection(),
        ),
      );

      setTimeout(() => {
        this.pageData.set(res.applications ?? []);
        this.total.set(res.totalRecords ?? 0);
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }

  private buildQueryParams(): Params {
    return {
      page: this.page(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDir: this.sortDirection(),
    };
  }

  private updateUrlQueryParams(): void {
    const qp: Params = this.buildQueryParams();
    this.router.navigate([], {
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
