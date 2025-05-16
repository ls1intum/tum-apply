import { Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';

import { DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { ApplicationEvaluationOverviewDTO, ApplicationEvaluationResourceService } from '../../../generated';

@Component({
  selector: 'jhi-application-overview',
  standalone: true,
  imports: [CommonModule, ButtonComponent, DynamicTableComponent, FaIconComponent],
  templateUrl: './application-overview.component.html',
  styleUrl: './application-overview.component.scss',
})
export class ApplicationOverviewComponent {
  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  loading = signal(false);
  pageData = signal<ApplicationEvaluationOverviewDTO[]>([]);
  pageSize = signal(10);
  total = signal(0);

  constructor(private evaluationService: ApplicationEvaluationResourceService) {}

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
