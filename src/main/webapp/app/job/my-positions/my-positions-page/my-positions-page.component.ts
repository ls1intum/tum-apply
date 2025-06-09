import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';

import { CreatedJobDTO, JobResourceService } from '../../../generated';
import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { TagComponent } from '../../../shared/components/atoms/tag/tag.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-my-positions-page',
  standalone: true,
  imports: [CommonModule, TagComponent, ButtonComponent, DynamicTableComponent],
  templateUrl: './my-positions-page.component.html',
  styleUrl: './my-positions-page.component.scss',
})
export class MyPositionsPageComponent {
  jobs = signal<CreatedJobDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);

  readonly actionTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const tpl = this.actionTemplate();
    const stateTpl = this.stateTemplate();
    return [
      { field: 'avatar', header: '', width: '5rem' },
      { field: 'professorName', header: 'Supervising Professor', width: '12rem' },
      { field: 'title', header: 'Job', width: '26rem' },
      { field: 'state', header: 'Status', width: '10rem', alignCenter: true, template: stateTpl },
      { field: 'startDate', header: 'Start Date', type: 'date', width: '10rem' },
      { field: 'createdAt', header: 'Created', type: 'date', width: '10rem' },
      { field: 'lastModifiedAt', header: 'Last Modified', type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: tpl },
    ];
  });

  readonly stateTextMap = signal<Record<string, string>>({
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    CLOSED: 'Closed',
    APPLICANT_FOUND: 'Applicant Found',
  });

  readonly stateSeverityMap = signal<Record<string, 'success' | 'warn' | 'danger' | 'info'>>({
    DRAFT: 'info',
    PUBLISHED: 'success',
    CLOSED: 'danger',
    APPLICANT_FOUND: 'warn',
  });

  private jobService = inject(JobResourceService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadJobs();
  }

  private async loadJobs(): Promise<void> {
    try {
      const userId = '00000000-0000-0000-0000-000000000105';
      const pageData = await firstValueFrom(this.jobService.getJobsByProfessor(userId, this.pageSize(), this.page()));
      this.jobs.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch (error) {
      console.error('Failed to load jobs from API:', error);
    }
  }
}
