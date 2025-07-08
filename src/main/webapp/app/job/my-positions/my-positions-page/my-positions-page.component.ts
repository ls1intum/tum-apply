import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { AccountService } from 'app/core/auth/account.service';
import { Router } from '@angular/router';
import { TranslateDirective } from 'app/shared/language';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CreatedJobDTO, JobResourceService } from '../../../generated';
import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { TagComponent } from '../../../shared/components/atoms/tag/tag.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { Sort, SortBarComponent, SortOption } from '../../../shared/components/molecules/sort-bar/sort-bar.component';

@Component({
  selector: 'jhi-my-positions-page',
  standalone: true,
  imports: [CommonModule, TagComponent, ButtonComponent, DynamicTableComponent, TranslateDirective, TranslateModule, SortBarComponent],
  templateUrl: './my-positions-page.component.html',
  styleUrl: './my-positions-page.component.scss',
})
export class MyPositionsPageComponent {
  jobs = signal<CreatedJobDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  userId = signal<string>('');

  sortBy = signal<string>('lastModifiedAt');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly sortableFields: SortOption[] = [
    { displayName: 'Last Modified', field: 'lastModifiedAt', type: 'NUMBER' },
    { displayName: 'Job Title', field: 'title', type: 'TEXT' },
    { displayName: 'Status', field: 'state', type: 'TEXT' },
    { displayName: 'Start Date', field: 'startDate', type: 'NUMBER' },
    { displayName: 'Created', field: 'createdAt', type: 'NUMBER' },
  ];

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();

    return [
      { field: 'avatar', header: '', width: '5rem' },
      { field: 'professorName', header: this.translate.instant('myPositionsPage.tableColumn.supervisingProfessor'), width: '12rem' },
      { field: 'title', header: this.translate.instant('myPositionsPage.tableColumn.job'), width: '26rem' },
      {
        field: 'state',
        header: this.translate.instant('myPositionsPage.tableColumn.status'),
        width: '10rem',
        alignCenter: true,
        template: stateTpl,
      },
      { field: 'startDate', header: this.translate.instant('myPositionsPage.tableColumn.startDate'), type: 'date', width: '10rem' },
      { field: 'createdAt', header: this.translate.instant('myPositionsPage.tableColumn.created'), type: 'date', width: '10rem' },
      { field: 'lastModifiedAt', header: this.translate.instant('myPositionsPage.tableColumn.lastModified'), type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly stateTextMap = computed<Record<string, string>>(() => ({
    DRAFT: this.translate.instant('myPositionsPage.state.draft'),
    PUBLISHED: this.translate.instant('myPositionsPage.state.published'),
    CLOSED: this.translate.instant('myPositionsPage.state.closed'),
    APPLICANT_FOUND: this.translate.instant('myPositionsPage.state.applicantFound'),
  }));

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    DRAFT: 'info',
    PUBLISHED: 'success',
    CLOSED: 'danger',
    APPLICANT_FOUND: 'warn',
  });

  private jobService = inject(JobResourceService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadJobs();
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field ?? this.sortableFields[0].field);
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

  async onDeleteJob(jobId: string): Promise<void> {
    // TO-DO: adjust confirmation
    const confirmDelete = confirm('Do you really want to delete this job?');
    if (confirmDelete) {
      try {
        await firstValueFrom(this.jobService.deleteJob(jobId));
        alert('Job successfully deleted');
        await this.loadJobs();
      } catch (error) {
        if (error instanceof Error) {
          alert(`Error deleting job: ${error.message}`);
        }
      }
    }
  }

  private async loadJobs(): Promise<void> {
    try {
      this.userId.set(this.accountService.loadedUser()?.id ?? '');
      if (this.userId() === '') {
        return;
      }
      const pageData = await firstValueFrom(
        this.jobService.getJobsByProfessor(
          this.pageSize(),
          this.page(),
          undefined, // Optional title filter
          undefined, // Optional state filter
          this.sortBy(),
          this.sortDirection(),
        ),
      );
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
    }
  }
}
