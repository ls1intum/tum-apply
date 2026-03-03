import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AccountService } from 'app/core/auth/account.service';
import { Router } from '@angular/router';
import { TranslateDirective } from 'app/shared/language';
import { ToastService } from 'app/service/toast-service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { emptyToUndef } from 'app/core/util/array-util.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { JhiMenuItem, MenuComponent } from 'app/shared/components/atoms/menu/menu.component';

import { DynamicTableColumn, DynamicTableComponent } from '../../shared/components/organisms/dynamic-table/dynamic-table.component';
import LocalizedDatePipe from '../../shared/pipes/localized-date.pipe';
import { TagComponent } from '../../shared/components/atoms/tag/tag.component';
import { CreatedJobDTO } from '../../generated/model/createdJobDTO';
import { JobResourceApiService } from '../../generated/api/jobResourceApi.service';
@Component({
  selector: 'jhi-my-positions-page',
  standalone: true,
  imports: [
    TagComponent,
    ButtonComponent,
    DynamicTableComponent,
    TranslateDirective,
    TranslateModule,
    ConfirmDialog,
    SearchFilterSortBar,
    LocalizedDatePipe,
    MenuComponent,
    ButtonModule,
    FontAwesomeModule,
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
  searchQuery = signal<string>('');

  sortBy = signal<string>('lastModifiedAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly sortableFields: SortOption[] = [
    { displayName: 'myPositionsPage.tableColumn.lastModified', fieldName: 'lastModifiedAt', type: 'NUMBER' },
    { displayName: 'myPositionsPage.tableColumn.job', fieldName: 'title', type: 'TEXT' },
    { displayName: 'myPositionsPage.tableColumn.status', fieldName: 'state', type: 'TEXT' },
    { displayName: 'myPositionsPage.tableColumn.startDate', fieldName: 'startDate', type: 'NUMBER' },
    { displayName: 'myPositionsPage.tableColumn.created', fieldName: 'createdAt', type: 'NUMBER' },
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
  readonly startDateTemplate = viewChild.required<TemplateRef<unknown>>('startDateTemplate');
  readonly createdAtTemplate = viewChild.required<TemplateRef<unknown>>('createdAtTemplate');
  readonly lastModifiedAtTemplate = viewChild.required<TemplateRef<unknown>>('lastModifiedAtTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly editPublishedDialog = viewChild.required<ConfirmDialog>('editPublishedDialog');
  readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');
  readonly closeDialog = viewChild.required<ConfirmDialog>('closeDialog');

  currentJobId = signal<string | undefined>(undefined);

  readonly selectedStatusFilters = signal<string[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();
    const startDateTpl = this.startDateTemplate();
    const lastModifiedAtTpl = this.lastModifiedAtTemplate();

    return [
      { field: 'professorName', header: 'myPositionsPage.tableColumn.supervisingProfessor', width: '12rem' },
      { field: 'title', header: 'myPositionsPage.tableColumn.job', width: '20rem' },
      {
        field: 'state',
        header: 'myPositionsPage.tableColumn.status',
        width: '10rem',
        template: stateTpl,
      },
      { field: 'startDate', header: 'myPositionsPage.tableColumn.startDate', width: '10rem', template: startDateTpl },
      { field: 'lastModifiedAt', header: 'myPositionsPage.tableColumn.lastModified', width: '10rem', template: lastModifiedAtTpl },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  readonly stateSeverityMap = signal<Record<string, 'info' | 'success' | 'contrast' | 'secondary'>>({
    DRAFT: 'info',
    PUBLISHED: 'secondary',
    CLOSED: 'contrast',
    APPLICANT_FOUND: 'success',
  });

  // Computed signal that creates a map of job IDs to their menu items
  readonly jobMenuItems = computed<Map<string, JhiMenuItem[]>>(() => {
    const menuMap = new Map<string, JhiMenuItem[]>();

    for (const job of this.jobs()) {
      const items: JhiMenuItem[] = [];

      // Edit action - different behavior for DRAFT vs PUBLISHED
      if (job.state === 'DRAFT') {
        items.push({
          label: 'button.edit',
          icon: 'pencil',
          severity: 'primary',
          command: () => {
            this.onEditJob(job.jobId);
          },
        });
      } else if (job.state === 'PUBLISHED') {
        items.push({
          label: 'button.edit',
          icon: 'pencil',
          severity: 'primary',
          command: () => {
            this.currentJobId.set(job.jobId);
            this.editPublishedDialog().confirm();
          },
        });
      }

      // Delete/Close action - based on state
      if (job.state === 'DRAFT') {
        items.push({
          label: 'button.delete',
          icon: 'trash',
          severity: 'danger',
          command: () => {
            this.currentJobId.set(job.jobId);
            this.deleteDialog().confirm();
          },
        });
      } else if (job.state === 'PUBLISHED') {
        items.push({
          label: 'button.close',
          icon: 'xmark',
          severity: 'danger',
          command: () => {
            this.currentJobId.set(job.jobId);
            this.closeDialog().confirm();
          },
        });
      }

      menuMap.set(job.jobId, items);
    }

    return menuMap;
  });

  readonly getMenuItems = computed(() => {
    const menuMap = this.jobMenuItems();
    return (job: CreatedJobDTO): JhiMenuItem[] => {
      return menuMap.get(job.jobId) ?? [];
    };
  });

  private jobService = inject(JobResourceApiService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  private readonly translationKey: string = 'myPositionsPage';

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
    if (filterChange.filterId === 'status') {
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
    void this.router.navigate(['/job/create']);
  }

  onEditJob(jobId: string): void {
    if (!jobId) {
      console.error('Unable to edit job with job id:', jobId);
    }
    void this.router.navigate([`/job/edit/${jobId}`]);
  }

  onViewJob(jobId: string): void {
    if (!jobId) {
      console.error('Unable to view job with job id:', jobId);
    }
    void this.router.navigate([`/job/detail/${jobId}`]);
  }

  async onDeleteJob(jobId: string): Promise<void> {
    try {
      await firstValueFrom(this.jobService.deleteJob(jobId));
      this.toastService.showSuccessKey(`${this.translationKey}.toastMessages.deleteJobSuccess`);
      await this.loadJobs();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.showErrorKey(`${this.translationKey}.toastMessages.deleteJobFailed`, { detail: error.message });
      }
    }
  }

  async onCloseJob(jobId: string): Promise<void> {
    try {
      await firstValueFrom(this.jobService.changeJobState(jobId, 'CLOSED'));
      this.toastService.showSuccessKey(`${this.translationKey}.toastMessages.closeJobSuccess`);
      await this.loadJobs();
    } catch (error) {
      if (error instanceof Error) {
        this.toastService.showErrorKey(`${this.translationKey}.toastMessages.closeJobFailed`, { detail: error.message });
      }
    }
  }

  onConfirmEdit(): void {
    const jobId = this.currentJobId();
    if (jobId !== undefined && jobId !== '') {
      this.onEditJob(jobId);
    }
  }

  async onConfirmDelete(): Promise<void> {
    const jobId = this.currentJobId();
    if (jobId !== undefined && jobId !== '') {
      await this.onDeleteJob(jobId);
    }
  }

  async onConfirmClose(): Promise<void> {
    const jobId = this.currentJobId();
    if (jobId !== undefined && jobId !== '') {
      await this.onCloseJob(jobId);
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
      const pageData = await firstValueFrom(
        this.jobService.getJobsForCurrentResearchGroup(
          this.pageSize(),
          this.page(),
          emptyToUndef(this.selectedStatusFilters()),
          this.sortBy(),
          this.sortDirection(),
          this.searchQuery(),
        ),
      );
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey('myPositionsPage.errors.loadJobs');
    }
  }
}
