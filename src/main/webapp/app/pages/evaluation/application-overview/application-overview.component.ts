import { AfterViewInit, Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../../generated';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [CommonModule, ButtonComponent, DynamicTableComponent],
  templateUrl: './application-overview.component.html',
  styleUrl: './application-overview.component.scss',
})
export class ApplicationOverviewComponent implements AfterViewInit {
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;
  columns: DynamicTableColumn[] = [];

  loading = signal(false);
  pageData = signal<ApplicationEvaluationOverviewDTO[]>([]);
  pageSize = signal(10);
  total = signal(0);

  constructor(private evaluationService: ApplicationEvaluationResourceService) {}

  ngAfterViewInit(): void {
    this.columns = [
      { field: 'avatar', header: '', width: '5rem' },
      { field: 'name', header: 'Name', width: '12rem' },
      { field: 'state', header: 'Status', width: '10rem', alignCenter: true },
      { field: 'jobName', header: 'Job', width: '26rem' },
      { field: 'rating', header: 'Rating', width: '10rem' },
      { field: 'appliedAt', header: 'Applied at', type: 'date', width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: this.actionTemplate },
    ];
  }

  async loadPage(event: TableLazyLoadEvent): Promise<void> {
    this.loading.set(true);

    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = first / rows;

    try {
      const res = await firstValueFrom(this.evaluationService.getApplications(rows, page).pipe());

      setTimeout(() => {
        this.pageData.set(res.applications ?? []);
        this.total.set(res.totalRecords ?? 0);
        this.pageSize.set(rows);
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
