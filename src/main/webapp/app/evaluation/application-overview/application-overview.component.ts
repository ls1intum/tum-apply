import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

import { DynamicTableColumn, DynamicTableComponent } from '../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../generated';
import { Sort, SortBarComponent, SortOption } from '../../shared/components/molecules/sort-bar/sort-bar.component';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [CommonModule, ButtonComponent, DynamicTableComponent, SortBarComponent, TagComponent],
  templateUrl: './application-overview.component.html',
  styleUrl: './application-overview.component.scss',
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
      // { field: 'avatar', header: '', width: '5rem' },
      { field: 'name', header: 'Name', width: '12rem' },
      { field: 'state', header: 'Status', width: '10rem', alignCenter: true, template: stateTpl },
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

  private readonly evaluationService = inject(ApplicationEvaluationResourceService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = first / rows;

    this.page.set(page);
    this.pageSize.set(rows);
    void this.loadPage();
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field ?? this.sortableFields[0].field);
    this.sortDirection.set(event.direction);
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.evaluationService.getApplications(this.pageSize(), this.page(), this.sortBy(), this.sortDirection()),
      );

      setTimeout(() => {
        this.pageData.set(res.applications ?? []);
        this.total.set(res.totalRecords ?? 0);
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }
}
