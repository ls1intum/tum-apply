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

@Component({
  selector: 'jhi-my-positions-page',
  standalone: true,
  imports: [CommonModule, TagComponent, ButtonComponent, DynamicTableComponent, TranslateDirective, TranslateModule],
  templateUrl: './my-positions-page.component.html',
  styleUrl: './my-positions-page.component.scss',
})
export class MyPositionsPageComponent {
  jobs = signal<CreatedJobDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  userId = signal<string>('');

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

  onCreateJob(): void {
    this.router.navigate(['/job-creation']);
  }

  onEditJob(jobId: string): void {
    // TO-DO: implement job editing logic + page
    // check if job id is connected to a valid job
    if (!jobId) {
      // show an alert that the current job does not exist or there was an issue editing the job
      console.error('Unable to edit job with job id:', jobId);
    }
    this.router.navigate(['/job-creation']);
  }

  onDeleteJob(jobId: string): void {
    // TO-DO: adjust confirmation
    const confirmDelete = confirm('Do you really want to delete this job?');
    if (confirmDelete) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => {
          alert('Job successfully deleted');
          void this.loadJobs();
        },
        error(err) {
          alert('Error deleting job');
          console.error('Delete failed', err);
        },
      });
    }
  }

  private async loadJobs(): Promise<void> {
    try {
      this.userId.set(this.accountService.loadedUser()?.id ?? '');
      if (this.userId() === '') {
        return;
      }
      const pageData = await firstValueFrom(this.jobService.getJobsByProfessor(this.userId(), this.pageSize(), this.page()));
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
    }
  }
}
