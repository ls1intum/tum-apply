import { Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

import { DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { StatusBadgeComponent } from '../../../shared/components/atoms/status-badge/status-badge.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../../generated';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [CommonModule, ButtonComponent, DynamicTableComponent, StatusBadgeComponent, FaIconComponent],
  templateUrl: './application-overview.component.html',
  styleUrl: './application-overview.component.scss',
})
export class ApplicationOverviewComponent {
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  pageSize = 10;
  pageData: ApplicationEvaluationOverviewDTO[] = [];
  total = 0;
  loading = signal(false);

  constructor(private evaluationService: ApplicationEvaluationResourceService) {}

  async loadPage(event: TableLazyLoadEvent): Promise<void> {
    console.warn('Loading Page');
    this.loading.set(true);

    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    const page = first / rows;

    try {
      const res = await firstValueFrom(this.evaluationService.getApplications(rows, page));
      this.pageData = res.applications ?? [];
      console.warn('Applications: ', this.pageData);
      this.total = res.totalRecords ?? 0;
      this.pageSize = rows;
      console.warn('Page Size: ', this.pageSize);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      console.warn('Setting loading to false');
      this.loading.set(false);
    }
  }
}
