import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { AccountService } from 'app/core/auth/account.service';
import { Router } from '@angular/router';
import { TranslateDirective } from 'app/shared/language';
import { ToastService } from 'app/service/toast-service';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { TagComponent } from '../../../shared/components/atoms/tag/tag.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { CreatedJobDTO } from '../../../generated/model/createdJobDTO';
import { JobResourceApiService } from '../../../generated/api/jobResourceApi.service';
@Component({
  selector: 'jhi-my-positions-page',
  standalone: true,
  imports: [
    CommonModule,
    TagComponent,
    ButtonComponent,
    DynamicTableComponent,
    TranslateDirective,
    TranslateModule,
    ConfirmDialog,
    SearchFilterSortBar,
  ],
  templateUrl: './my-positions-page.component.html',
  styleUrl: './my-positions-page.component.scss',
})
export class MyPositionsPageComponent {
  jobs = signal<CreatedJobDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  userId = signal<string>('');
  searchQuery = signal<string | null>(null);

  sortBy = signal<string>('lastModifiedAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly sortableFields: SortOption[] = [
    { displayName: 'myPositionsPage.sortingOptions.lastModified', fieldName: 'lastModifiedAt', type: 'NUMBER' },
    { displayName: 'myPositionsPage.sortingOptions.jobTitle', fieldName: 'title', type: 'TEXT' },
    { displayName: 'myPositionsPage.sortingOptions.status', fieldName: 'state', type: 'TEXT' },
    { displayName: 'myPositionsPage.sortingOptions.startDate', fieldName: 'startDate', type: 'NUMBER' },
    { displayName: 'myPositionsPage.sortingOptions.created', fieldName: 'createdAt', type: 'NUMBER' },
  ];

  readonly availableStatusOptions: { key: string; label: string }[] = [
    { key: 'DRAFT', label: 'jobState.draft' },
    { key: 'PUBLISHED', label: 'jobState.published' },
    { key: 'CLOSED', label: 'jobState.closed' },
    { key: 'APPLICANT_FOUND', label: 'jobState.applicantFound' },
  ];

  readonly stateTextMap = computed<Record<string, string>>(() =>
    this.availableStatusOptions.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.label;
      return acc;
    }, {}),
  );

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly selectedJobFilters = signal<string[]>([]);
  readonly selectedStatusFilters = signal<string[]>([]);

  readonly allJobNames = signal<string[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();

    return [
      { field: 'avatar', header: '', width: '5rem' },
      { field: 'professorName', header: 'myPositionsPage.tableColumn.supervisingProfessor', width: '12rem' },
      { field: 'title', header: 'myPositionsPage.tableColumn.job', width: '26rem' },
      {
        field: 'state',
        header: 'myPositionsPage.tableColumn.status',
        width: '10rem',
        alignCenter: true,
        template: stateTpl,
      },
      { field: 'startDate', header: 'myPositionsPage.tableColumn.startDate', type: 'date', width: '10rem' },
      { field: 'createdAt', header: 'myPositionsPage.tableColumn.created', type: 'date', width: '10rem' },
      { field: 'lastModifiedAt', header: 'myPositionsPage.tableColumn.lastModified', type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    DRAFT: 'info',
    PUBLISHED: 'success',
    CLOSED: 'danger',
    APPLICANT_FOUND: 'warn',
  });

  private jobService = inject(JobResourceApiService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    void this.loadAllJobNames();
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
    const currentQuery = this.searchQuery()?.trim().replace(/\s+/g, ' ') ?? null;

    if (normalizedQuery !== currentQuery) {
      this.page.set(0);
      this.searchQuery.set(normalizedQuery);
      void this.loadJobs();
    }
  }

  onFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterLabel === 'myPositionsPage.tableColumn.job') {
      this.page.set(0);
      this.selectedJobFilters.set(filterChange.selectedValues);
      void this.loadJobs();
    } else if (filterChange.filterLabel === 'myPositionsPage.tableColumn.status') {
      this.page.set(0);
      const enumValues = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedStatusFilters.set(enumValues);
      void this.loadJobs();
    }
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);
    void this.loadJobs();
  }

  onCreateJob(): void {
    this.router.navigate(['/job/create']);
  }

  onEditJob(jobId: string): void {
    if (!jobId) {
      console.error('Unable to edit job with job id:', jobId);
    }
    this.router.navigate([`/job/edit/${jobId}`]);
  }

  onViewJob(jobId: string): void {
    if (!jobId) {
      console.error('Unable to view job with job id:', jobId);
    }
    this.router.navigate([`/job/detail/${jobId}`]);
  }

  async loadAllJobNames(): Promise<void> {
    try {
      const jobNames = await firstValueFrom(this.jobService.getAllJobNamesByProfessor());
      this.allJobNames.set(jobNames.sort());
    } catch {
      this.allJobNames.set([]);
      this.toastService.showErrorKey('myPositionsPage.errors.loadJobNames');
    }
  }

  async onDeleteJob(jobId: string): Promise<void> {
    try {
      await firstValueFrom(this.jobService.deleteJob(jobId));
      this.toastService.showSuccess({ detail: 'Job successfully deleted' });
      await this.loadJobs();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.showError({ detail: `Error deleting job: ${error.message}` });
      }
    }
  }

  async onCloseJob(jobId: string): Promise<void> {
    try {
      await firstValueFrom(this.jobService.changeJobState(jobId, 'CLOSED'));
      this.toastService.showSuccess({ detail: 'Job successfully closed' });
      await this.loadJobs();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.showError({ detail: `Error closing job: ${error.message}` });
      }
    }
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): string[] {
    const keyMap = new Map(this.availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => keyMap.get(key) ?? key);
  }

  private async loadJobs(): Promise<void> {
    try {
      this.userId.set(this.accountService.loadedUser()?.id ?? '');
      if (this.userId() === '') {
        return;
      }
      const jobNameFilters = this.selectedJobFilters().length > 0 ? this.selectedJobFilters() : [];
      const statusFilters = this.selectedStatusFilters().length > 0 ? this.selectedStatusFilters() : [];
      const pageData = await firstValueFrom(
        this.jobService.getJobsByProfessor(
          this.pageSize(),
          this.page(),
          jobNameFilters.length ? jobNameFilters : undefined,
          statusFilters.length ? statusFilters : undefined,
          this.sortBy(),
          this.sortDirection(),
          this.searchQuery() ?? undefined,
        ),
      );
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey('myPositionsPage.errors.loadJobs');
    }
  }
}
